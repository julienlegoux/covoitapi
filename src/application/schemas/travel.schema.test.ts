import { describe, it, expect } from 'vitest';
import { createTravelSchema } from './travel.schema.js';

describe('createTravelSchema', () => {
	const validInput = {
		kms: 150,
		date: '2025-06-15',
		departureCity: 'Paris',
		arrivalCity: 'Lyon',
		seats: 3,
		carId: 'car-1',
	};

	it('should accept valid route input', () => {
		const result = createTravelSchema.safeParse(validInput);
		expect(result.success).toBe(true);
	});

	it('should reject missing kms', () => {
		const { kms, ...rest } = validInput;
		const result = createTravelSchema.safeParse(rest);
		expect(result.success).toBe(false);
	});

	it('should reject non-integer kms', () => {
		const result = createTravelSchema.safeParse({ ...validInput, kms: 15.5 });
		expect(result.success).toBe(false);
	});

	it('should reject negative kms', () => {
		const result = createTravelSchema.safeParse({ ...validInput, kms: -10 });
		expect(result.success).toBe(false);
	});

	it('should reject zero kms', () => {
		const result = createTravelSchema.safeParse({ ...validInput, kms: 0 });
		expect(result.success).toBe(false);
	});

	it('should not require userId (userId comes from JWT)', () => {
		const result = createTravelSchema.safeParse(validInput);
		expect(result.success).toBe(true);
	});

	it('should reject missing date', () => {
		const { date, ...rest } = validInput;
		const result = createTravelSchema.safeParse(rest);
		expect(result.success).toBe(false);
	});

	it('should reject missing departureCity', () => {
		const { departureCity, ...rest } = validInput;
		const result = createTravelSchema.safeParse(rest);
		expect(result.success).toBe(false);
	});

	it('should reject missing arrivalCity', () => {
		const { arrivalCity, ...rest } = validInput;
		const result = createTravelSchema.safeParse(rest);
		expect(result.success).toBe(false);
	});

	it('should reject missing seats', () => {
		const { seats, ...rest } = validInput;
		const result = createTravelSchema.safeParse(rest);
		expect(result.success).toBe(false);
	});

	it('should reject zero seats', () => {
		const result = createTravelSchema.safeParse({ ...validInput, seats: 0 });
		expect(result.success).toBe(false);
	});

	it('should reject missing carId', () => {
		const { carId, ...rest } = validInput;
		const result = createTravelSchema.safeParse(rest);
		expect(result.success).toBe(false);
	});
});
