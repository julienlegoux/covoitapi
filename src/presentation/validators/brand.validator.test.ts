import { describe, it, expect } from 'vitest';
import { createBrandSchema } from './brand.validator.js';

describe('createBrandSchema', () => {
	it('should accept valid brand name', () => {
		const result = createBrandSchema.safeParse({ nom: 'Toyota' });
		expect(result.success).toBe(true);
	});

	it('should reject missing nom field', () => {
		const result = createBrandSchema.safeParse({});
		expect(result.success).toBe(false);
	});

	it('should reject empty nom string', () => {
		const result = createBrandSchema.safeParse({ nom: '' });
		expect(result.success).toBe(false);
	});

	it('should reject non-string nom', () => {
		const result = createBrandSchema.safeParse({ nom: 123 });
		expect(result.success).toBe(false);
	});
});
