import { Resend } from 'resend';
import { injectable } from 'tsyringe';
import type { EmailService, SendEmailOptions } from '../../domain/services/email.service.js';
import type { Result } from '../../lib/shared/types/result.js';
import { ok, err } from '../../lib/shared/types/result.js';
import { EmailDeliveryError } from '../../lib/errors/email.errors.js';

@injectable()
export class ResendEmailService implements EmailService {
	private readonly resend: Resend;

	constructor() {
		this.resend = new Resend(process.env.RESEND_API_KEY);
	}

	async sendWelcomeEmail(to: string, firstName: string): Promise<Result<void, EmailDeliveryError>> {
		return this.send({
			to,
			subject: 'Welcome to Carpooling!',
			html: `
        <h1>Welcome, ${firstName}!</h1>
        <p>Thank you for joining our carpooling platform.</p>
        <p>Start exploring rides and save money while reducing your carbon footprint!</p>
      `,
		});
	}

	async send(options: SendEmailOptions): Promise<Result<void, EmailDeliveryError>> {
		const fromEmail = process.env.RESEND_FROM_EMAIL;
		if (!fromEmail) {
			return err(new EmailDeliveryError(options.to, new Error('RESEND_FROM_EMAIL not configured')));
		}

		try {
			await this.resend.emails.send({
				from: fromEmail,
				to: options.to,
				subject: options.subject,
				html: options.html,
			});
			return ok(undefined);
		} catch (e) {
			return err(new EmailDeliveryError(options.to, e));
		}
	}
}
