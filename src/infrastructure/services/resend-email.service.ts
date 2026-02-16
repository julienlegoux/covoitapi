/**
 * @module resend-email.service
 * Resend-based implementation of the {@link EmailService} domain interface.
 * Sends transactional emails (welcome messages, notifications) via the
 * Resend API. Configured through RESEND_API_KEY and RESEND_FROM_EMAIL
 * environment variables.
 */

import { Resend } from 'resend';
import { inject, injectable } from 'tsyringe';
import type { EmailService, SendEmailOptions } from '../../domain/services/email.service.js';
import type { Logger } from '../../lib/logging/logger.types.js';
import { TOKENS } from '../../lib/shared/di/tokens.js';
import type { Result } from '../../lib/shared/types/result.js';
import { ok, err } from '../../lib/shared/types/result.js';
import { EmailDeliveryError } from '../../lib/errors/email.errors.js';
import { escapeHtml } from '../../lib/shared/utils/html-escape.util.js';

/**
 * Resend implementation of {@link EmailService}.
 * Uses the `resend` npm package to send transactional emails.
 * The API key is read from `RESEND_API_KEY` env var at construction.
 * The sender address is read from `RESEND_FROM_EMAIL` env var at send time.
 * All delivery errors are wrapped in {@link EmailDeliveryError} with the
 * recipient address for debugging.
 * Injected via tsyringe as a singleton.
 */
@injectable()
export class ResendEmailService implements EmailService {
	private readonly resend: Resend;
	private readonly logger: Logger;

	/**
	 * Initializes the Resend SDK client with the API key from environment.
	 */
	constructor(@inject(TOKENS.Logger) logger: Logger) {
		this.logger = logger.child({ service: 'EmailService' });
		this.resend = new Resend(process.env.RESEND_API_KEY);
	}

	/**
	 * Sends a welcome email to a newly registered user.
	 * Delegates to {@link send} with a pre-built HTML template.
	 * @param to - The recipient email address.
	 * @param firstName - The user's first name, interpolated into the greeting.
	 * @returns `ok(undefined)` on success,
	 *          or `err(EmailDeliveryError)` on failure.
	 */
	async sendWelcomeEmail(to: string, firstName: string): Promise<Result<void, EmailDeliveryError>> {
		const safeFirstName = escapeHtml(firstName);
		return this.send({
			to,
			subject: 'Welcome to Carpooling!',
			html: `
        <h1>Welcome, ${safeFirstName}!</h1>
        <p>Thank you for joining our carpooling platform.</p>
        <p>Start exploring rides and save money while reducing your carbon footprint!</p>
      `,
		});
	}

	/**
	 * Sends an email with the given options via the Resend API.
	 * Reads the sender address from RESEND_FROM_EMAIL at call time, returning
	 * an error if it is not configured.
	 * @param options - Email options including to, subject, and html body.
	 * @returns `ok(undefined)` on success,
	 *          or `err(EmailDeliveryError)` if the env var is missing or the API call fails.
	 *          The error includes the recipient address for debugging.
	 */
	async send(options: SendEmailOptions): Promise<Result<void, EmailDeliveryError>> {
		const fromEmail = process.env.RESEND_FROM_EMAIL;
		if (!fromEmail) {
			this.logger.error('RESEND_FROM_EMAIL not configured');
			return err(new EmailDeliveryError(options.to, new Error('RESEND_FROM_EMAIL not configured')));
		}

		try {
			await this.resend.emails.send({
				from: fromEmail,
				to: options.to,
				subject: options.subject,
				html: options.html,
			});
			this.logger.info('Email sent', { to: options.to, subject: options.subject });
			return ok(undefined);
		} catch (e) {
			this.logger.error('Email delivery failed', e instanceof Error ? e : null, { to: options.to, subject: options.subject });
			return err(new EmailDeliveryError(options.to, e));
		}
	}
}
