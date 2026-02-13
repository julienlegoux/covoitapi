/**
 * @module repository.errors
 * Defines error classes for database/repository operations.
 * These errors wrap underlying database exceptions into the Result pattern,
 * allowing use cases to handle persistence failures without catching exceptions.
 */

import { InfrastructureError } from './infrastructure.error.js';

/**
 * Base class for all repository-level errors.
 * @extends InfrastructureError
 */
export class RepositoryError extends InfrastructureError {
	constructor(message: string, code: string, cause?: unknown) {
		super(message, code, cause);
		this.name = 'RepositoryError';
	}
}

/**
 * Thrown when a database query or mutation fails.
 * This is the most common repository error, wrapping Prisma exceptions.
 *
 * @extends RepositoryError
 * @param message - Description of what database operation failed.
 * @param cause - The underlying Prisma/database error.
 */
export class DatabaseError extends RepositoryError {
	constructor(message: string, cause?: unknown) {
		super(message, 'DATABASE_ERROR', cause);
		this.name = 'DatabaseError';
	}
}

/**
 * Thrown when the database connection itself fails.
 *
 * @extends RepositoryError
 * @param cause - The underlying connection error.
 */
export class ConnectionError extends RepositoryError {
	constructor(cause?: unknown) {
		super('Database connection failed', 'CONNECTION_ERROR', cause);
		this.name = 'ConnectionError';
	}
}

/**
 * Thrown when a delete operation fails due to a foreign key constraint.
 * This means the record is still referenced by other records and cannot be removed.
 *
 * @extends RepositoryError
 * @param entity - The type of entity that could not be deleted (e.g. "brand").
 * @param cause - The underlying Prisma/database error.
 */
export class RelationConstraintError extends RepositoryError {
	constructor(entity: string, cause?: unknown) {
		super(`Cannot delete ${entity} because it is still referenced by other records`, 'RELATION_CONSTRAINT', cause);
		this.name = 'RelationConstraintError';
	}
}
