/**
 * @module logger
 * Structured logging implementation with environment-aware formatting.
 * In production, outputs JSON for log aggregation tools.
 * In development, outputs colorized, human-readable output to the console.
 * Automatically enriches log entries with request context (requestId, userId)
 * from the AsyncLocalStorage-backed request context.
 */

import { getContext } from '../context/request-context.js';
import {
	type ErrorInfo,
	LOG_LEVELS,
	type LogEntry,
	type LogFormatter,
	type Logger,
	type LogLevel,
} from './logger.types.js';

/**
 * JSON formatter for production environments.
 * Outputs each log entry as a single JSON line, suitable for log aggregation.
 */
class JsonFormatter implements LogFormatter {
	format(entry: LogEntry): string {
		return JSON.stringify(entry);
	}
}

/**
 * Pretty formatter for development environments.
 * Outputs colorized, human-readable log lines with ANSI escape codes.
 */
class PrettyFormatter implements LogFormatter {
	private readonly colors = {
		debug: '\x1b[36m', // cyan
		info: '\x1b[32m', // green
		warn: '\x1b[33m', // yellow
		error: '\x1b[31m', // red
		reset: '\x1b[0m',
		dim: '\x1b[2m',
	};

	format(entry: LogEntry): string {
		const color = this.colors[entry.level];
		const reset = this.colors.reset;
		const dim = this.colors.dim;

		const timestamp = dim + entry.timestamp + reset;
		const level = color + entry.level.toUpperCase().padEnd(5) + reset;
		// Show first 8 chars of requestId for brevity
		const reqId = entry.requestId ? `${dim}[${entry.requestId.slice(0, 8)}]${reset}` : '';

		let output = `${timestamp} ${level} ${reqId} ${entry.message}`;

		if (entry.context && Object.keys(entry.context).length > 0) {
			output += ` ${dim}${JSON.stringify(entry.context)}${reset}`;
		}

		if (entry.error) {
			output += `\n${color}  Error: ${entry.error.name}: ${entry.error.message}${reset}`;
			if (entry.error.stack) {
				output += `\n${dim}${entry.error.stack}${reset}`;
			}
		}

		return output;
	}
}

/**
 * Converts an Error object into a serializable ErrorInfo structure.
 * @param error - The error to serialize.
 * @returns A plain object with name, message, stack, and optional code.
 */
function serializeError(error: Error): ErrorInfo {
	return {
		name: error.name,
		message: error.message,
		stack: error.stack,
		code: (error as { code?: string }).code,
	};
}

/**
 * Determines the minimum log level from environment variables.
 * Falls back to "info" in production and "debug" in development.
 * @returns The minimum LogLevel to output.
 */
function getMinLogLevel(): LogLevel {
	const envLevel = process.env.LOG_LEVEL?.toLowerCase();
	if (envLevel && envLevel in LOG_LEVELS) {
		return envLevel as LogLevel;
	}
	return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

/**
 * Selects the appropriate log formatter based on the environment.
 * @returns JsonFormatter for production, PrettyFormatter for development.
 */
function getFormatter(): LogFormatter {
	return process.env.NODE_ENV === 'production' ? new JsonFormatter() : new PrettyFormatter();
}

/**
 * Core structured logger implementation.
 * Enriches every log entry with the current request context and base context.
 * Supports child loggers that inherit and extend the parent's base context.
 */
class StructuredLogger implements Logger {
	private readonly formatter: LogFormatter;
	private readonly minLevel: LogLevel;
	private readonly baseContext: Record<string, unknown>;

	constructor(baseContext: Record<string, unknown> = {}) {
		this.formatter = getFormatter();
		this.minLevel = getMinLogLevel();
		this.baseContext = baseContext;
	}

	/** Checks if the given level meets the minimum threshold. */
	private shouldLog(level: LogLevel): boolean {
		return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel];
	}

	/** Builds a structured LogEntry, pulling requestId/userId from AsyncLocalStorage. */
	private createEntry(
		level: LogLevel,
		message: string,
		context?: Record<string, unknown>,
		error?: Error | null,
	): LogEntry {
		const reqContext = getContext();

		return {
			level,
			message,
			timestamp: new Date().toISOString(),
			requestId: reqContext?.requestId,
			userId: reqContext?.userId,
			context: { ...this.baseContext, ...context },
			error: error ? serializeError(error) : undefined,
		};
	}

	/** Formats and outputs a log entry to the appropriate console method. */
	private log(
		level: LogLevel,
		message: string,
		context?: Record<string, unknown>,
		error?: Error | null,
	): void {
		if (!this.shouldLog(level)) return;

		const entry = this.createEntry(level, message, context, error);
		const output = this.formatter.format(entry);

		switch (level) {
			case 'debug':
				console.debug(output);
				break;
			case 'info':
				console.info(output);
				break;
			case 'warn':
				console.warn(output);
				break;
			case 'error':
				console.error(output);
				break;
		}
	}

	debug(message: string, context?: Record<string, unknown>): void {
		this.log('debug', message, context);
	}

	info(message: string, context?: Record<string, unknown>): void {
		this.log('info', message, context);
	}

	warn(message: string, context?: Record<string, unknown>): void {
		this.log('warn', message, context);
	}

	error(message: string, error?: Error | null, context?: Record<string, unknown>): void {
		this.log('error', message, context, error);
	}

	child(context: Record<string, unknown>): Logger {
		return new StructuredLogger({ ...this.baseContext, ...context });
	}
}

/** Default application-wide logger instance. */
export const logger: Logger = new StructuredLogger();

/**
 * Creates a new logger instance with the given base context.
 * @param context - Optional base context to include in all log entries.
 * @returns A new StructuredLogger instance.
 */
export function createLogger(context?: Record<string, unknown>): Logger {
	return new StructuredLogger(context);
}
