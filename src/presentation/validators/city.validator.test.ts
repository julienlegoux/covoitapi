import { describe, it, expect } from 'vitest';
import { createCitySchema } from './city.validator.js';

describe('createCitySchema', () => {
	const validInput = { ville: 'Paris', cp: '75000' };

	it('should accept valid city input', () => {
		const result = createCitySchema.safeParse(validInput);
		expect(result.success).toBe(true);
	});

	it('should reject missing ville', () => {
		const result = createCitySchema.safeParse({ cp: '75000' });
		expect(result.success).toBe(false);
	});

	it('should reject empty ville', () => {
		const result = createCitySchema.safeParse({ ...validInput, ville: '' });
		expect(result.success).toBe(false);
	});

	it('should reject missing cp', () => {
		const result = createCitySchema.safeParse({ ville: 'Paris' });
		expect(result.success).toBe(false);
	});

	it('should reject empty cp', () => {
		const result = createCitySchema.safeParse({ ...validInput, cp: '' });
		expect(result.success).toBe(false);
	});
});
