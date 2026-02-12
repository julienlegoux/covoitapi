/**
 * @module StructuredLoggerTests
 *
 * Test suite for the StructuredLogger created via createLogger(). Covers
 * log level filtering (debug, info, warn, error) based on LOG_LEVEL env var,
 * JSON formatting in production mode, automatic enrichment with timestamp,
 * requestId, and userId from the request context, Error object serialization,
 * child logger context merging, and ad-hoc context inclusion in log calls.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/** Tests for the StructuredLogger covering level filtering, formatting, context enrichment, and child loggers. */
describe('StructuredLogger', () => {
	const originalEnv = process.env;
	let consoleSpy: {
		debug: ReturnType<typeof vi.spyOn>;
		info: ReturnType<typeof vi.spyOn>;
		warn: ReturnType<typeof vi.spyOn>;
		error: ReturnType<typeof vi.spyOn>;
	};

	beforeEach(() => {
		vi.resetModules();
		process.env = { ...originalEnv };
		consoleSpy = {
			debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
			info: vi.spyOn(console, 'info').mockImplementation(() => {}),
			warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
			error: vi.spyOn(console, 'error').mockImplementation(() => {}),
		};
	});

	afterEach(() => {
		process.env = originalEnv;
		vi.restoreAllMocks();
	});

	/** Tests for log level filtering based on the LOG_LEVEL environment variable. */
	describe('log levels', () => {
		/** Validates that debug messages are emitted when LOG_LEVEL=debug in development. */
		it('should log debug in development', async () => {
			process.env.NODE_ENV = 'development';
			process.env.LOG_LEVEL = 'debug';
			const { createLogger } = await import('./logger.js');
			const logger = createLogger();

			logger.debug('debug message');

			expect(consoleSpy.debug).toHaveBeenCalled();
		});

		/** Validates that debug messages are suppressed when the minimum level is info. */
		it('should not log debug when minLevel is info', async () => {
			process.env.NODE_ENV = 'development';
			process.env.LOG_LEVEL = 'info';
			const { createLogger } = await import('./logger.js');
			const logger = createLogger();

			logger.debug('debug message');

			expect(consoleSpy.debug).not.toHaveBeenCalled();
		});

		/** Validates that info messages are emitted when LOG_LEVEL is set to debug (below warn). */
		it('should log info at all levels below warn', async () => {
			process.env.LOG_LEVEL = 'debug';
			const { createLogger } = await import('./logger.js');
			const logger = createLogger();

			logger.info('info message');

			expect(consoleSpy.info).toHaveBeenCalled();
		});

		/** Validates that warn messages are emitted when LOG_LEVEL=warn. */
		it('should log warn at warn level', async () => {
			process.env.LOG_LEVEL = 'warn';
			const { createLogger } = await import('./logger.js');
			const logger = createLogger();

			logger.warn('warn message');

			expect(consoleSpy.warn).toHaveBeenCalled();
		});

		/** Validates that error messages are always emitted, even at the strictest log level. */
		it('should log error at all levels', async () => {
			process.env.LOG_LEVEL = 'error';
			const { createLogger } = await import('./logger.js');
			const logger = createLogger();

			logger.error('error message');

			expect(consoleSpy.error).toHaveBeenCalled();
		});
	});

	/** Tests for log output formatting, timestamp inclusion, request context enrichment, and Error serialization. */
	describe('formatting', () => {
		/** Validates that production mode outputs valid JSON with message and level fields. */
		it('should use JsonFormatter in production', async () => {
			process.env.NODE_ENV = 'production';
			process.env.LOG_LEVEL = 'info';
			const { createLogger } = await import('./logger.js');
			const logger = createLogger();

			logger.info('test message');

			const output = consoleSpy.info.mock.calls[0][0];
			expect(() => JSON.parse(output)).not.toThrow();
			const parsed = JSON.parse(output);
			expect(parsed.message).toBe('test message');
			expect(parsed.level).toBe('info');
		});

		/** Validates that each log entry contains a valid ISO 8601 timestamp. */
		it('should include timestamp in log entry', async () => {
			process.env.NODE_ENV = 'production';
			process.env.LOG_LEVEL = 'info';
			const { createLogger } = await import('./logger.js');
			const logger = createLogger();

			logger.info('test message');

			const output = consoleSpy.info.mock.calls[0][0];
			const parsed = JSON.parse(output);
			expect(parsed.timestamp).toBeDefined();
			expect(new Date(parsed.timestamp).toISOString()).toBe(parsed.timestamp);
		});

		/** Validates that the requestId from the active AsyncLocalStorage context is included in log output. */
		it('should include requestId from context', async () => {
			process.env.NODE_ENV = 'production';
			process.env.LOG_LEVEL = 'info';
			const { createLogger } = await import('./logger.js');
			const { runWithContext: runCtx } = await import('../../lib/context/request-context.js');
			const logger = createLogger();

			await runCtx({ requestId: 'test-req-id' }, async () => {
				logger.info('test message');
			});

			const output = consoleSpy.info.mock.calls[0][0];
			const parsed = JSON.parse(output);
			expect(parsed.requestId).toBe('test-req-id');
		});

		/** Validates that the userId from the active AsyncLocalStorage context is included in log output. */
		it('should include userId from context', async () => {
			process.env.NODE_ENV = 'production';
			process.env.LOG_LEVEL = 'info';
			const { createLogger } = await import('./logger.js');
			const { runWithContext: runCtx } = await import('../../lib/context/request-context.js');
			const logger = createLogger();

			await runCtx({ userId: 'test-user-id' }, async () => {
				logger.info('test message');
			});

			const output = consoleSpy.info.mock.calls[0][0];
			const parsed = JSON.parse(output);
			expect(parsed.userId).toBe('test-user-id');
		});

		/** Validates that Error objects are serialized with name, message, and stack fields in JSON output. */
		it('should serialize Error objects correctly', async () => {
			process.env.NODE_ENV = 'production';
			process.env.LOG_LEVEL = 'info';
			const { createLogger } = await import('./logger.js');
			const logger = createLogger();

			const testError = new Error('test error');
			logger.error('error occurred', testError);

			const output = consoleSpy.error.mock.calls[0][0];
			const parsed = JSON.parse(output);
			expect(parsed.error.name).toBe('Error');
			expect(parsed.error.message).toBe('test error');
			expect(parsed.error.stack).toBeDefined();
		});
	});

	/** Tests for the child() method that creates a sub-logger with merged context. */
	describe('child()', () => {
		/** Validates that a child logger inherits the parent's context and adds its own fields. */
		it('should create logger with merged context', async () => {
			process.env.NODE_ENV = 'production';
			process.env.LOG_LEVEL = 'info';
			const { createLogger } = await import('./logger.js');
			const logger = createLogger({ service: 'auth' });
			const childLogger = logger.child({ component: 'login' });

			childLogger.info('test message');

			const output = consoleSpy.info.mock.calls[0][0];
			const parsed = JSON.parse(output);
			expect(parsed.context.service).toBe('auth');
			expect(parsed.context.component).toBe('login');
		});
	});

	/** Tests for ad-hoc context data passed directly to individual log calls. */
	describe('context inclusion', () => {
		/** Validates that extra context fields passed at call time appear in the JSON output. */
		it('should include provided context in log', async () => {
			process.env.NODE_ENV = 'production';
			process.env.LOG_LEVEL = 'info';
			const { createLogger } = await import('./logger.js');
			const logger = createLogger();

			logger.info('test message', { action: 'test', count: 42 });

			const output = consoleSpy.info.mock.calls[0][0];
			const parsed = JSON.parse(output);
			expect(parsed.context.action).toBe('test');
			expect(parsed.context.count).toBe(42);
		});
	});
});
