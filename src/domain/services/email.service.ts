/**
 * @module email.service
 * Defines the email service interface and its options type.
 * This contract abstracts email sending operations, allowing different
 * email providers (e.g. Resend, SendGrid) to be swapped via dependency injection.
 */

import type { Result } from '../../lib/shared/types/result.js';
import type { EmailError } from '../../lib/errors/email.errors.js';

/**
 * Options for sending a custom email.
 *
 * @property to - The recipient's email address.
 * @property subject - The email subject line.
 * @property html - The email body as HTML content.
 */
export type SendEmailOptions = {
	to: string;
	subject: string;
	html: string;
};

export interface EmailService {
	/**
	 * Sends a welcome email to a newly registered user.
	 * @param to - The recipient's email address.
	 * @param firstName - The user's first name for personalization.
	 * @returns Void on success.
	 */
	sendWelcomeEmail(to: string, firstName: string): Promise<Result<void, EmailError>>;

	/**
	 * Sends a custom email with the specified options.
	 * @param options - The email configuration (to, subject, html body).
	 * @returns Void on success.
	 */
	send(options: SendEmailOptions): Promise<Result<void, EmailError>>;
}
