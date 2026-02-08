import { getContext } from '../context/request-context.js';
import {
	type ErrorInfo,
	LOG_LEVELS,
	type LogEntry,
	type LogFormatter,
	type Logger,
	type LogLevel,
} from './logger.types.js';

// JSON Formatter for production
class JsonFormatter implements LogFormatter {
	format(entry: LogEntry): string {
		return JSON.stringify(entry);
	}
}

// Pretty Formatter for development
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

function serializeError(error: Error): ErrorInfo {
	return {
		name: error.name,
		message: error.message,
		stack: error.stack,
		code: (error as { code?: string }).code,
	};
}

function getMinLogLevel(): LogLevel {
	const envLevel = process.env.LOG_LEVEL?.toLowerCase();
	if (envLevel && envLevel in LOG_LEVELS) {
		return envLevel as LogLevel;
	}
	return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

function getFormatter(): LogFormatter {
	return process.env.NODE_ENV === 'production' ? new JsonFormatter() : new PrettyFormatter();
}

class StructuredLogger implements Logger {
	private readonly formatter: LogFormatter;
	private readonly minLevel: LogLevel;
	private readonly baseContext: Record<string, unknown>;

	constructor(baseContext: Record<string, unknown> = {}) {
		this.formatter = getFormatter();
		this.minLevel = getMinLogLevel();
		this.baseContext = baseContext;
	}

	private shouldLog(level: LogLevel): boolean {
		return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel];
	}

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

export const logger: Logger = new StructuredLogger();

export function createLogger(context?: Record<string, unknown>): Logger {
	return new StructuredLogger(context);
}
