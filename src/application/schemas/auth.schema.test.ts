import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema } from './auth.schema.js';

describe('registerSchema', () => {
	const validInput = {
		email: 'test@example.com',
		password: 'Password123',
		confirmPassword: 'Password123',
	};

	describe('email validation', () => {
		it('should accept valid email', () => {
			const result = registerSchema.safeParse(validInput);
			expect(result.success).toBe(true);
		});

		it('should reject invalid email format', () => {
			const result = registerSchema.safeParse({ ...validInput, email: 'invalid-email' });
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues.some((i) => i.path.includes('email'))).toBe(true);
			}
		});

		it('should reject empty email', () => {
			const result = registerSchema.safeParse({ ...validInput, email: '' });
			expect(result.success).toBe(false);
		});

		it('should reject email without domain', () => {
			const result = registerSchema.safeParse({ ...validInput, email: 'test@' });
			expect(result.success).toBe(false);
		});

		it('should reject email without @', () => {
			const result = registerSchema.safeParse({ ...validInput, email: 'testexample.com' });
			expect(result.success).toBe(false);
		});
	});

	describe('password validation', () => {
		it('should accept password with lowercase, uppercase, and number', () => {
			const result = registerSchema.safeParse({ ...validInput, password: 'ValidPass1', confirmPassword: 'ValidPass1' });
			expect(result.success).toBe(true);
		});

		it('should reject password shorter than 8 characters', () => {
			const result = registerSchema.safeParse({ ...validInput, password: 'Pass1', confirmPassword: 'Pass1' });
			expect(result.success).toBe(false);
			if (!result.success) {
				const passwordIssue = result.error.issues.find((i) => i.path.includes('password'));
				expect(passwordIssue?.message).toContain('at least 8 characters');
			}
		});

		it('should reject password without lowercase', () => {
			const result = registerSchema.safeParse({ ...validInput, password: 'PASSWORD123', confirmPassword: 'PASSWORD123' });
			expect(result.success).toBe(false);
			if (!result.success) {
				const passwordIssue = result.error.issues.find((i) => i.path.includes('password'));
				expect(passwordIssue?.message).toContain('lowercase');
			}
		});

		it('should reject password without uppercase', () => {
			const result = registerSchema.safeParse({ ...validInput, password: 'password123', confirmPassword: 'password123' });
			expect(result.success).toBe(false);
			if (!result.success) {
				const passwordIssue = result.error.issues.find((i) => i.path.includes('password'));
				expect(passwordIssue?.message).toContain('uppercase');
			}
		});

		it('should reject password without number', () => {
			const result = registerSchema.safeParse({ ...validInput, password: 'Passwordabc', confirmPassword: 'Passwordabc' });
			expect(result.success).toBe(false);
			if (!result.success) {
				const passwordIssue = result.error.issues.find((i) => i.path.includes('password'));
				expect(passwordIssue?.message).toContain('number');
			}
		});
	});

	describe('confirmPassword validation', () => {
		it('should accept matching passwords', () => {
			const result = registerSchema.safeParse(validInput);
			expect(result.success).toBe(true);
		});

		it('should reject non-matching passwords with correct path', () => {
			const result = registerSchema.safeParse({ ...validInput, confirmPassword: 'DifferentPass1' });
			expect(result.success).toBe(false);
			if (!result.success) {
				const confirmPasswordIssue = result.error.issues.find((i) => i.path.includes('confirmPassword'));
				expect(confirmPasswordIssue).toBeDefined();
				expect(confirmPasswordIssue?.message).toBe('Passwords do not match');
			}
		});
	});

	it('should not require firstName, lastName, or phone', () => {
		const result = registerSchema.safeParse(validInput);
		expect(result.success).toBe(true);
	});
});

describe('loginSchema', () => {
	const validInput = {
		email: 'test@example.com',
		password: 'anypassword',
	};

	it('should accept valid email and password', () => {
		const result = loginSchema.safeParse(validInput);
		expect(result.success).toBe(true);
	});

	it('should reject invalid email', () => {
		const result = loginSchema.safeParse({ ...validInput, email: 'invalid' });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.some((i) => i.path.includes('email'))).toBe(true);
		}
	});

	it('should reject empty password', () => {
		const result = loginSchema.safeParse({ ...validInput, password: '' });
		expect(result.success).toBe(false);
		if (!result.success) {
			const passwordIssue = result.error.issues.find((i) => i.path.includes('password'));
			expect(passwordIssue?.message).toBe('Password is required');
		}
	});

	it('should accept any non-empty password (no strength requirements for login)', () => {
		const result = loginSchema.safeParse({ ...validInput, password: 'a' });
		expect(result.success).toBe(true);
	});

	it('should reject missing email', () => {
		const result = loginSchema.safeParse({ password: 'password' });
		expect(result.success).toBe(false);
	});

	it('should reject missing password', () => {
		const result = loginSchema.safeParse({ email: 'test@example.com' });
		expect(result.success).toBe(false);
	});
});
