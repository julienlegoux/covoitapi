import { injectable } from "tsyringe";
import { Resend } from "resend";
import type {
  EmailService,
  SendEmailOptions,
} from "../../domain/services/email.service.js";
import { env } from "../config/env.config.js";

@injectable()
export class ResendEmailService implements EmailService {
  private readonly resend: Resend;

  constructor() {
    this.resend = new Resend(env.RESEND_API_KEY);
  }

  async sendWelcomeEmail(to: string, firstName: string): Promise<void> {
    await this.send({
      to,
      subject: "Welcome to Carpooling!",
      html: `
        <h1>Welcome, ${firstName}!</h1>
        <p>Thank you for joining our carpooling platform.</p>
        <p>Start exploring rides and save money while reducing your carbon footprint!</p>
      `,
    });
  }

  async send(options: SendEmailOptions): Promise<void> {
    await this.resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  }
}
