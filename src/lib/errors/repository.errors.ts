import { InfrastructureError } from './infrastructure.error.js';

export class RepositoryError extends InfrastructureError {
	constructor(message: string, code: string, cause?: unknown) {
		super(message, code, cause);
		this.name = 'RepositoryError';
	}
}

export class DatabaseError extends RepositoryError {
	constructor(message: string, cause?: unknown) {
		super(message, 'DATABASE_ERROR', cause);
		this.name = 'DatabaseError';
	}
}

export class ConnectionError extends RepositoryError {
	constructor(cause?: unknown) {
		super('Database connection failed', 'CONNECTION_ERROR', cause);
		this.name = 'ConnectionError';
	}
}
