/**
 * @module logger.types
 * Defines types and interfaces for the structured logging system.
 * Provides the Logger interface, log entry shape, formatter contract,
 * and log level definitions used across the application.
 */

/** Available log severity levels, ordered from least to most severe. */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Serialized error information included in log entries.
 *
 * @property name - The error class name (e.g. "DatabaseError").
 * @property message - The error message.
 * @property stack - Optional stack trace.
 * @property code - Optional machine-readable error code.
 */
export interface ErrorInfo {
	name: string;
	message: string;
	stack?: string;
	code?: string;
}

/**
 * Structured log entry produced by the logger.
 *
 * @property level - Log severity level.
 * @property message - Human-readable log message.
 * @property timestamp - ISO 8601 timestamp of when the entry was created.
 * @property requestId - Optional request ID from the AsyncLocalStorage context.
 * @property userId - Optional authenticated user ID from the request context.
 * @property context - Optional key-value metadata attached to the log entry.
 * @property error - Optional serialized error information.
 */
export interface LogEntry {
	level: LogLevel;
	message: string;
	timestamp: string;
	requestId?: string;
	userId?: string;
	context?: Record<string, unknown>;
	error?: ErrorInfo;
}

/**
 * Contract for log entry formatters.
 * Implementations convert a LogEntry into a string for output.
 */
export interface LogFormatter {
	/**
	 * Formats a log entry into a printable string.
	 * @param entry - The structured log entry to format.
	 * @returns The formatted string output.
	 */
	format(entry: LogEntry): string;
}

/**
 * Application logger interface.
 * Supports leveled logging with optional context metadata and child loggers.
 */
export interface Logger {
	/** Logs a debug-level message. */
	debug(message: string, context?: Record<string, unknown>): void;
	/** Logs an info-level message. */
	info(message: string, context?: Record<string, unknown>): void;
	/** Logs a warning-level message. */
	warn(message: string, context?: Record<string, unknown>): void;
	/** Logs an error-level message with an optional error object. */
	error(message: string, error?: Error | null, context?: Record<string, unknown>): void;
	/**
	 * Creates a child logger with merged base context.
	 * @param context - Additional context to include in all child log entries.
	 * @returns A new Logger instance with the merged context.
	 */
	child(context: Record<string, unknown>): Logger;
}

/**
 * Numeric priority mapping for log levels.
 * Used to determine whether a message should be logged based on the minimum level.
 */
export const LOG_LEVELS: Record<LogLevel, number> = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3,
};
