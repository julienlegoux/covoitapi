import { describe, it, expect } from 'vitest';
import { createBrandSchema } from './brand.validator.js';

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
