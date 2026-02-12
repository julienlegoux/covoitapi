/**
 * @module user.schema.test
 * Unit tests for the user profile Zod schema (profileSchema).
 * Verifies that firstName and lastName are required non-empty strings,
 * and that phone meets the minimum 10-character length requirement.
 */

import { describe, it, expect } from 'vitest';
import { profileSchema } from './user.schema.js';

/** Tests for profileSchema -- validates firstName, lastName, and phone constraints. */
describe('profileSchema', () => {
	const validInput = {
		firstName: 'John',
		lastName: 'Doe',
		phone: '0612345678',
	};

	it('should accept valid profile input', () => {
		const result = profileSchema.safeParse(validInput);
		expect(result.success).toBe(true);
	});

	it('should reject missing firstName', () => {
		const { firstName, ...rest } = validInput;
		const result = profileSchema.safeParse(rest);
		expect(result.success).toBe(false);
	});

	it('should reject empty firstName', () => {
		const result = profileSchema.safeParse({ ...validInput, firstName: '' });
		expect(result.success).toBe(false);
	});

	it('should reject missing lastName', () => {
		const { lastName, ...rest } = validInput;
		const result = profileSchema.safeParse(rest);
		expect(result.success).toBe(false);
	});

	it('should reject empty lastName', () => {
		const result = profileSchema.safeParse({ ...validInput, lastName: '' });
		expect(result.success).toBe(false);
	});

	it('should reject missing phone', () => {
		const { phone, ...rest } = validInput;
		const result = profileSchema.safeParse(rest);
		expect(result.success).toBe(false);
	});

	it('should reject phone shorter than 10 characters', () => {
		const result = profileSchema.safeParse({ ...validInput, phone: '061234' });
		expect(result.success).toBe(false);
	});

	it('should accept phone with exactly 10 characters', () => {
		const result = profileSchema.safeParse({ ...validInput, phone: '0612345678' });
		expect(result.success).toBe(true);
	});

	it('should accept phone with more than 10 characters', () => {
		const result = profileSchema.safeParse({ ...validInput, phone: '+33612345678' });
		expect(result.success).toBe(true);
	});
});
