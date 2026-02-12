/**
 * @module shared
 * Public barrel export for shared utilities, DI tokens, types, and the logger.
 * Provides a single import point for commonly used shared modules.
 */

// DI Tokens
export type { TokenKeys } from './di/tokens.js';
export { TOKENS } from './di/tokens.js';

// Types
export * from './types/index.js';
export type { LogEntry, LogLevel } from '../logging/logger.types.js';

// Utils
export { logger } from '../logging/logger.js';
