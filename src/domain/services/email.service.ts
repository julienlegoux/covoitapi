import type { Result } from '../../lib/shared/types/result.js';
import type { EmailError } from '../../lib/errors/email.errors.js';

export type SendEmailOptions = {
	to: string;
	subject: string;
	html: string;
};

export interface EmailService {
	sendWelcomeEmail(to: string, firstName: string): Promise<Result<void, EmailError>>;
	send(options: SendEmailOptions): Promise<Result<void, EmailError>>;
}
