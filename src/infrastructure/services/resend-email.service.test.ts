import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EmailDeliveryError } from '../errors/email.errors.js';

const mockSend = vi.fn();

vi.mock('resend', () => ({
	Resend: class MockResend {
		emails = {
			send: mockSend,
		};
	},
}));

describe('ResendEmailService', () => {
	let emailService: any;
	const originalEnv = process.env;

	beforeEach(async () => {
		vi.clearAllMocks();
		process.env = { ...originalEnv };
		process.env.RESEND_API_KEY = 'test-api-key';
		process.env.RESEND_FROM_EMAIL = 'noreply@test.com';

		const { ResendEmailService } = await import('./resend-email.service.js');
		emailService = new ResendEmailService();
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	describe('sendWelcomeEmail()', () => {
		it('should send email with correct recipient and firstName', async () => {
			mockSend.mockResolvedValue({ id: 'email-123' });

			await emailService.sendWelcomeEmail('user@example.com', 'John');

			expect(mockSend).toHaveBeenCalledWith(
				expect.objectContaining({
					to: 'user@example.com',
					subject: 'Welcome to Carpooling!',
					from: 'noreply@test.com',
				}),
			);
			const callArg = mockSend.mock.calls[0][0];
			expect(callArg.html).toContain('Welcome, John!');
		});

		it('should return ok(undefined) on success', async () => {
			mockSend.mockResolvedValue({ id: 'email-123' });

			const result = await emailService.sendWelcomeEmail('user@example.com', 'John');

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.value).toBeUndefined();
			}
		});

		it('should return err(EmailDeliveryError) on failure', async () => {
			mockSend.mockRejectedValue(new Error('API error'));

			const result = await emailService.sendWelcomeEmail('user@example.com', 'John');

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toBeInstanceOf(EmailDeliveryError);
				expect(result.error.recipient).toBe('user@example.com');
			}
		});
	});

	describe('send()', () => {
		it('should send email with provided options', async () => {
			mockSend.mockResolvedValue({ id: 'email-123' });

			await emailService.send({
				to: 'recipient@example.com',
				subject: 'Test Subject',
				html: '<p>Test content</p>',
			});

			expect(mockSend).toHaveBeenCalledWith({
				from: 'noreply@test.com',
				to: 'recipient@example.com',
				subject: 'Test Subject',
				html: '<p>Test content</p>',
			});
		});

		it('should return ok(undefined) on success', async () => {
			mockSend.mockResolvedValue({ id: 'email-123' });

			const result = await emailService.send({
				to: 'recipient@example.com',
				subject: 'Test Subject',
				html: '<p>Test content</p>',
			});

			expect(result.success).toBe(true);
		});

		it('should return err(EmailDeliveryError) on API error', async () => {
			mockSend.mockRejectedValue(new Error('Network error'));

			const result = await emailService.send({
				to: 'recipient@example.com',
				subject: 'Test Subject',
				html: '<p>Test content</p>',
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error).toBeInstanceOf(EmailDeliveryError);
			}
		});

		it('should include recipient in error', async () => {
			mockSend.mockRejectedValue(new Error('Delivery failed'));

			const result = await emailService.send({
				to: 'bounce@example.com',
				subject: 'Test Subject',
				html: '<p>Test content</p>',
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.recipient).toBe('bounce@example.com');
			}
		});
	});
});
