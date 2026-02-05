import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

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

	describe('log levels', () => {
		it('should log debug in development', async () => {
			process.env.NODE_ENV = 'development';
			process.env.LOG_LEVEL = 'debug';
			const { createLogger } = await import('./logger.js');
			const logger = createLogger();

			logger.debug('debug message');

			expect(consoleSpy.debug).toHaveBeenCalled();
		});

		it('should not log debug when minLevel is info', async () => {
			process.env.NODE_ENV = 'development';
			process.env.LOG_LEVEL = 'info';
			const { createLogger } = await import('./logger.js');
			const logger = createLogger();

			logger.debug('debug message');

			expect(consoleSpy.debug).not.toHaveBeenCalled();
		});

		it('should log info at all levels below warn', async () => {
			process.env.LOG_LEVEL = 'debug';
			const { createLogger } = await import('./logger.js');
			const logger = createLogger();

			logger.info('info message');

			expect(consoleSpy.info).toHaveBeenCalled();
		});

		it('should log warn at warn level', async () => {
			process.env.LOG_LEVEL = 'warn';
			const { createLogger } = await import('./logger.js');
			const logger = createLogger();

			logger.warn('warn message');

			expect(consoleSpy.warn).toHaveBeenCalled();
		});

		it('should log error at all levels', async () => {
			process.env.LOG_LEVEL = 'error';
			const { createLogger } = await import('./logger.js');
			const logger = createLogger();

			logger.error('error message');

			expect(consoleSpy.error).toHaveBeenCalled();
		});
	});

	describe('formatting', () => {
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

	describe('child()', () => {
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

	describe('context inclusion', () => {
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
