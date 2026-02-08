import { describe, it, expect } from 'vitest';
import { createCitySchema } from './city.validator.js';

describe('createCitySchema', () => {
	const validInput = { cityName: 'Paris', zipcode: '75000' };

	it('should accept valid city input', () => {
		const result = createCitySchema.safeParse(validInput);
		expect(result.success).toBe(true);
	});

	it('should reject missing cityName', () => {
		const result = createCitySchema.safeParse({ zipcode: '75000' });
		expect(result.success).toBe(false);
	});

	it('should reject empty cityName', () => {
		const result = createCitySchema.safeParse({ ...validInput, cityName: '' });
		expect(result.success).toBe(false);
	});

	it('should reject missing zipcode', () => {
		const result = createCitySchema.safeParse({ cityName: 'Paris' });
		expect(result.success).toBe(false);
	});

	it('should reject empty zipcode', () => {
		const result = createCitySchema.safeParse({ ...validInput, zipcode: '' });
		expect(result.success).toBe(false);
	});
});
