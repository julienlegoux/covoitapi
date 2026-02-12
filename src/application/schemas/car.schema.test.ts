/**
 * @module car.schema.test
 * Unit tests for the car Zod schemas (createCarSchema, updateCarSchema, patchCarSchema).
 * Verifies required fields for creation and full update, and optional fields for partial update.
 */

import { describe, it, expect } from 'vitest';
import { createCarSchema, updateCarSchema, patchCarSchema } from './car.schema.js';

/** Tests for createCarSchema -- all fields (model, brandId, licensePlate) are required and non-empty. */
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

/** Tests for updateCarSchema -- full update requires all fields (model, brandId, licensePlate). */
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

/** Tests for patchCarSchema -- partial update where all fields are optional but must be non-empty if provided. */
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
