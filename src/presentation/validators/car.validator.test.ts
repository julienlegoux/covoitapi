import { describe, it, expect } from 'vitest';
import { createCarSchema, updateCarSchema, patchCarSchema } from './car.validator.js';

describe('createCarSchema', () => {
	const validInput = { modele: 'Corolla', marqueId: 'brand-1', immatriculation: 'AB-123-CD' };

	it('should accept valid car input', () => {
		const result = createCarSchema.safeParse(validInput);
		expect(result.success).toBe(true);
	});

	it('should reject missing modele', () => {
		const result = createCarSchema.safeParse({ marqueId: 'brand-1', immatriculation: 'AB-123-CD' });
		expect(result.success).toBe(false);
	});

	it('should reject empty modele', () => {
		const result = createCarSchema.safeParse({ ...validInput, modele: '' });
		expect(result.success).toBe(false);
	});

	it('should reject missing marqueId', () => {
		const result = createCarSchema.safeParse({ modele: 'Corolla', immatriculation: 'AB-123-CD' });
		expect(result.success).toBe(false);
	});

	it('should reject missing immatriculation', () => {
		const result = createCarSchema.safeParse({ modele: 'Corolla', marqueId: 'brand-1' });
		expect(result.success).toBe(false);
	});
});

describe('updateCarSchema', () => {
	const validInput = { modele: 'Corolla', marqueId: 'brand-1', immatriculation: 'AB-123-CD' };

	it('should accept valid full update input', () => {
		const result = updateCarSchema.safeParse(validInput);
		expect(result.success).toBe(true);
	});

	it('should reject missing modele', () => {
		const result = updateCarSchema.safeParse({ marqueId: 'brand-1', immatriculation: 'AB-123-CD' });
		expect(result.success).toBe(false);
	});

	it('should reject missing marqueId', () => {
		const result = updateCarSchema.safeParse({ modele: 'Corolla', immatriculation: 'AB-123-CD' });
		expect(result.success).toBe(false);
	});

	it('should reject missing immatriculation', () => {
		const result = updateCarSchema.safeParse({ modele: 'Corolla', marqueId: 'brand-1' });
		expect(result.success).toBe(false);
	});
});

describe('patchCarSchema', () => {
	it('should accept partial input with only modele', () => {
		const result = patchCarSchema.safeParse({ modele: 'Yaris' });
		expect(result.success).toBe(true);
	});

	it('should accept partial input with only immatriculation', () => {
		const result = patchCarSchema.safeParse({ immatriculation: 'XY-999-ZZ' });
		expect(result.success).toBe(true);
	});

	it('should accept empty object', () => {
		const result = patchCarSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it('should reject empty string for modele', () => {
		const result = patchCarSchema.safeParse({ modele: '' });
		expect(result.success).toBe(false);
	});

	it('should reject empty string for marqueId', () => {
		const result = patchCarSchema.safeParse({ marqueId: '' });
		expect(result.success).toBe(false);
	});
});
