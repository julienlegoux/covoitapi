import type { LogEntry, LogLevel } from '../types/logger.types.js';

function formatLog(entry: LogEntry): string {
	const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
	return `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${contextStr}`;
}

function createLogEntry(
	level: LogLevel,
	message: string,
	context?: Record<string, unknown>,
): LogEntry {
	return {
		level,
		message,
		timestamp: new Date().toISOString(),
		context,
	};
}

export const logger = {
	debug(message: string, context?: Record<string, unknown>): void {
		if (process.env.NODE_ENV !== 'production') {
			console.debug(formatLog(createLogEntry('debug', message, context)));
		}
	},

	info(message: string, context?: Record<string, unknown>): void {
		console.info(formatLog(createLogEntry('info', message, context)));
	},

	warn(message: string, context?: Record<string, unknown>): void {
		console.warn(formatLog(createLogEntry('warn', message, context)));
	},

	error(message: string, context?: Record<string, unknown>): void {
		console.error(formatLog(createLogEntry('error', message, context)));
	},
};
