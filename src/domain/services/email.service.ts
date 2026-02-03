export type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
};

export interface EmailService {
  sendWelcomeEmail(to: string, firstName: string): Promise<void>;
  send(options: SendEmailOptions): Promise<void>;
}
