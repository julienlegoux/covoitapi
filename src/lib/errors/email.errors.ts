import { InfrastructureError } from './infrastructure.error.js';

export class EmailError extends InfrastructureError {
	constructor(message: string, code: string, cause?: unknown) {
		super(message, code, cause);
		this.name = 'EmailError';
	}
}

export class EmailDeliveryError extends EmailError {
	constructor(
		public readonly recipient: string,
		cause?: unknown,
	) {
		super(`Failed to deliver email to ${recipient}`, 'EMAIL_DELIVERY_FAILED', cause);
		this.name = 'EmailDeliveryError';
	}
}

export class EmailConfigError extends EmailError {
	constructor(cause?: unknown) {
		super('Email service is not configured correctly', 'EMAIL_CONFIG_ERROR', cause);
		this.name = 'EmailConfigError';
	}
}
