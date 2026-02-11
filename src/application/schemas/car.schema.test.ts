import { describe, it, expect } from 'vitest';
import { createCarSchema, updateCarSchema, patchCarSchema } from './car.schema.js';

describe('createCarSchema', () => {
	const validInput = { model: 'Corolla', brandId: 'brand-1', licensePlate: 'AB-123-CD' };

	it('should accept valid car input', () => {
		const result = createCarSchema.safeParse(validInput);
		expect(result.success).toBe(true);
	});

	it('should reject missing model', () => {
		const result = createCarSchema.safeParse({ brandId: 'brand-1', licensePlate: 'AB-123-CD' });
		expect(result.success).toBe(false);
	});

	it('should reject empty model', () => {
		const result = createCarSchema.safeParse({ ...validInput, model: '' });
		expect(result.success).toBe(false);
	});

	it('should reject missing brandId', () => {
		const result = createCarSchema.safeParse({ model: 'Corolla', licensePlate: 'AB-123-CD' });
		expect(result.success).toBe(false);
	});

	it('should reject missing licensePlate', () => {
		const result = createCarSchema.safeParse({ model: 'Corolla', brandId: 'brand-1' });
		expect(result.success).toBe(false);
	});
});

describe('updateCarSchema', () => {
	const validInput = { model: 'Corolla', brandId: 'brand-1', licensePlate: 'AB-123-CD' };

	it('should accept valid full update input', () => {
		const result = updateCarSchema.safeParse(validInput);
		expect(result.success).toBe(true);
	});

	it('should reject missing model', () => {
		const result = updateCarSchema.safeParse({ brandId: 'brand-1', licensePlate: 'AB-123-CD' });
		expect(result.success).toBe(false);
	});

	it('should reject missing brandId', () => {
		const result = updateCarSchema.safeParse({ model: 'Corolla', licensePlate: 'AB-123-CD' });
		expect(result.success).toBe(false);
	});

	it('should reject missing licensePlate', () => {
		const result = updateCarSchema.safeParse({ model: 'Corolla', brandId: 'brand-1' });
		expect(result.success).toBe(false);
	});
});

describe('patchCarSchema', () => {
	it('should accept partial input with only model', () => {
		const result = patchCarSchema.safeParse({ model: 'Yaris' });
		expect(result.success).toBe(true);
	});

	it('should accept partial input with only licensePlate', () => {
		const result = patchCarSchema.safeParse({ licensePlate: 'XY-999-ZZ' });
		expect(result.success).toBe(true);
	});

	it('should accept empty object', () => {
		const result = patchCarSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it('should reject empty string for model', () => {
		const result = patchCarSchema.safeParse({ model: '' });
		expect(result.success).toBe(false);
	});

	it('should reject empty string for brandId', () => {
		const result = patchCarSchema.safeParse({ brandId: '' });
		expect(result.success).toBe(false);
	});
});
