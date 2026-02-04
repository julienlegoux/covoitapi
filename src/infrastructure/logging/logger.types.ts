export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface ErrorInfo {
	name: string;
	message: string;
	stack?: string;
	code?: string;
}

export interface LogEntry {
	level: LogLevel;
	message: string;
	timestamp: string;
	requestId?: string;
	userId?: string;
	context?: Record<string, unknown>;
	error?: ErrorInfo;
}

export interface LogFormatter {
	format(entry: LogEntry): string;
}

export interface Logger {
	debug(message: string, context?: Record<string, unknown>): void;
	info(message: string, context?: Record<string, unknown>): void;
	warn(message: string, context?: Record<string, unknown>): void;
	error(message: string, error?: Error | null, context?: Record<string, unknown>): void;
	child(context: Record<string, unknown>): Logger;
}

export const LOG_LEVELS: Record<LogLevel, number> = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3,
};
