/**
 * @module email.errors
 * Defines error classes for email sending operations.
 * These errors are returned by EmailService implementations (e.g. Resend)
 * within the Result pattern.
 */

import { InfrastructureError } from './infrastructure.error.js';

/**
 * Base class for all email-related errors.
 * @extends InfrastructureError
 */
export class EmailError extends InfrastructureError {
	constructor(message: string, code: string, cause?: unknown) {
		super(message, code, cause);
		this.name = 'EmailError';
	}
}

/**
 * Thrown when an email fails to be delivered to the recipient.
 * Maps to HTTP 502 Bad Gateway.
 *
 * @property recipient - The email address delivery was attempted to.
 */
export class EmailDeliveryError extends EmailError {
	constructor(
		public readonly recipient: string,
		cause?: unknown,
	) {
		super(`Failed to deliver email to ${recipient}`, 'EMAIL_DELIVERY_FAILED', cause);
		this.name = 'EmailDeliveryError';
	}
}

/**
 * Thrown when the email service is misconfigured (e.g. missing API key).
 * Maps to HTTP 500 Internal Server Error.
 */
export class EmailConfigError extends EmailError {
	constructor(cause?: unknown) {
		super('Email service is not configured correctly', 'EMAIL_CONFIG_ERROR', cause);
		this.name = 'EmailConfigError';
	}
}
