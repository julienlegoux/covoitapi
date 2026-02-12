/**
 * @module brand.schema.test
 * Unit tests for the car brand Zod schema (createBrandSchema).
 * Verifies that the brand name is a required, non-empty string.
 */

import { describe, it, expect } from 'vitest';
import { createBrandSchema } from './brand.schema.js';

/** Tests for createBrandSchema -- validates brand name presence and type. */
describe('createBrandSchema', () => {
	it('should accept valid brand name', () => {
		const result = createBrandSchema.safeParse({ name: 'Toyota' });
		expect(result.success).toBe(true);
	});

	it('should reject missing name field', () => {
		const result = createBrandSchema.safeParse({});
		expect(result.success).toBe(false);
	});

	it('should reject empty name string', () => {
		const result = createBrandSchema.safeParse({ name: '' });
		expect(result.success).toBe(false);
	});

	it('should reject non-string name', () => {
		const result = createBrandSchema.safeParse({ name: 123 });
		expect(result.success).toBe(false);
	});
});
