import { describe, it, expect } from 'vitest';
import { createRouteSchema } from './route.validator.js';

describe('createRouteSchema', () => {
	const validInput = {
		kms: 150,
		idpers: 'user-1',
		dateT: '2025-06-15',
		villeD: 'Paris',
		villeA: 'Lyon',
		seats: 3,
		carId: 'car-1',
	};

	it('should accept valid route input', () => {
		const result = createRouteSchema.safeParse(validInput);
		expect(result.success).toBe(true);
	});

	it('should reject missing kms', () => {
		const { kms, ...rest } = validInput;
		const result = createRouteSchema.safeParse(rest);
		expect(result.success).toBe(false);
	});

	it('should reject non-integer kms', () => {
		const result = createRouteSchema.safeParse({ ...validInput, kms: 15.5 });
		expect(result.success).toBe(false);
	});

	it('should reject negative kms', () => {
		const result = createRouteSchema.safeParse({ ...validInput, kms: -10 });
		expect(result.success).toBe(false);
	});

	it('should reject zero kms', () => {
		const result = createRouteSchema.safeParse({ ...validInput, kms: 0 });
		expect(result.success).toBe(false);
	});

	it('should reject missing idpers', () => {
		const { idpers, ...rest } = validInput;
		const result = createRouteSchema.safeParse(rest);
		expect(result.success).toBe(false);
	});

	it('should reject missing dateT', () => {
		const { dateT, ...rest } = validInput;
		const result = createRouteSchema.safeParse(rest);
		expect(result.success).toBe(false);
	});

	it('should reject missing villeD', () => {
		const { villeD, ...rest } = validInput;
		const result = createRouteSchema.safeParse(rest);
		expect(result.success).toBe(false);
	});

	it('should reject missing villeA', () => {
		const { villeA, ...rest } = validInput;
		const result = createRouteSchema.safeParse(rest);
		expect(result.success).toBe(false);
	});

	it('should reject missing seats', () => {
		const { seats, ...rest } = validInput;
		const result = createRouteSchema.safeParse(rest);
		expect(result.success).toBe(false);
	});

	it('should reject zero seats', () => {
		const result = createRouteSchema.safeParse({ ...validInput, seats: 0 });
		expect(result.success).toBe(false);
	});

	it('should reject missing carId', () => {
		const { carId, ...rest } = validInput;
		const result = createRouteSchema.safeParse(rest);
		expect(result.success).toBe(false);
	});
});
