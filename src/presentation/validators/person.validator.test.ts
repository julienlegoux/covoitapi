import { describe, it, expect } from 'vitest';
import { createPersonSchema, updatePersonSchema, patchPersonSchema } from './person.validator.js';

describe('createPersonSchema', () => {
	const validInput = {
		firstName: 'John',
		lastName: 'Doe',
		phone: '0612345678',
		email: 'john@example.com',
		password: 'Password1',
	};

	it('should accept valid person input', () => {
		const result = createPersonSchema.safeParse(validInput);
		expect(result.success).toBe(true);
	});

	it('should reject missing firstName', () => {
		const { firstName, ...rest } = validInput;
		const result = createPersonSchema.safeParse(rest);
		expect(result.success).toBe(false);
	});

	it('should reject empty firstName', () => {
		const result = createPersonSchema.safeParse({ ...validInput, firstName: '' });
		expect(result.success).toBe(false);
	});

	it('should reject missing lastName', () => {
		const { lastName, ...rest } = validInput;
		const result = createPersonSchema.safeParse(rest);
		expect(result.success).toBe(false);
	});

	it('should reject missing phone', () => {
		const { phone, ...rest } = validInput;
		const result = createPersonSchema.safeParse(rest);
		expect(result.success).toBe(false);
	});

	it('should reject invalid email format', () => {
		const result = createPersonSchema.safeParse({ ...validInput, email: 'not-an-email' });
		expect(result.success).toBe(false);
	});

	it('should reject missing email', () => {
		const { email, ...rest } = validInput;
		const result = createPersonSchema.safeParse(rest);
		expect(result.success).toBe(false);
	});

	it('should reject password shorter than 8 characters', () => {
		const result = createPersonSchema.safeParse({ ...validInput, password: 'short' });
		expect(result.success).toBe(false);
	});

	it('should accept password of exactly 8 characters', () => {
		const result = createPersonSchema.safeParse({ ...validInput, password: '12345678' });
		expect(result.success).toBe(true);
	});
});

describe('updatePersonSchema', () => {
	const validInput = {
		firstName: 'John',
		lastName: 'Doe',
		phone: '0612345678',
		email: 'john@example.com',
	};

	it('should accept valid update input', () => {
		const result = updatePersonSchema.safeParse(validInput);
		expect(result.success).toBe(true);
	});

	it('should reject missing firstName', () => {
		const { firstName, ...rest } = validInput;
		const result = updatePersonSchema.safeParse(rest);
		expect(result.success).toBe(false);
	});

	it('should reject missing lastName', () => {
		const { lastName, ...rest } = validInput;
		const result = updatePersonSchema.safeParse(rest);
		expect(result.success).toBe(false);
	});

	it('should reject invalid email', () => {
		const result = updatePersonSchema.safeParse({ ...validInput, email: 'bad' });
		expect(result.success).toBe(false);
	});
});

describe('patchPersonSchema', () => {
	it('should accept partial input with only phone', () => {
		const result = patchPersonSchema.safeParse({ phone: '0712345678' });
		expect(result.success).toBe(true);
	});

	it('should accept partial input with only email', () => {
		const result = patchPersonSchema.safeParse({ email: 'new@example.com' });
		expect(result.success).toBe(true);
	});

	it('should accept empty object', () => {
		const result = patchPersonSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it('should reject invalid email when provided', () => {
		const result = patchPersonSchema.safeParse({ email: 'not-valid' });
		expect(result.success).toBe(false);
	});
});
