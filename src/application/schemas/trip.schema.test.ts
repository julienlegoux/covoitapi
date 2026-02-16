/**
 * @module trip.schema.test
 * Unit tests for the trip Zod schema (createTripSchema).
 * Verifies validation of all required fields (kms, date, departureCity,
 * arrivalCity, seats, carId) including integer and positivity constraints,
 * and confirms that userId is not required (it comes from the JWT token).
 */

import { describe, it, expect } from 'vitest';
import { createTripSchema } from './trip.schema.js';

/** Tests for createTripSchema -- validates all trip creation fields and their constraints. */
describe('createTripSchema', () => {
    const validInput = {
        kms: 150,
        date: '2025-06-15',
        departureCity: 'Paris',
        arrivalCity: 'Lyon',
        seats: 3,
        carId: 'car-1',
    };

    it('should accept valid trip input', () => {
        const result = createTripSchema.safeParse(validInput);
        expect(result.success).toBe(true);
    });

    it('should reject missing kms', () => {
        const { kms, ...rest } = validInput;
        const result = createTripSchema.safeParse(rest);
        expect(result.success).toBe(false);
    });

    it('should reject non-integer kms', () => {
        const result = createTripSchema.safeParse({ ...validInput, kms: 15.5 });
        expect(result.success).toBe(false);
    });

    it('should reject negative kms', () => {
        const result = createTripSchema.safeParse({ ...validInput, kms: -10 });
        expect(result.success).toBe(false);
    });

    it('should reject zero kms', () => {
        const result = createTripSchema.safeParse({ ...validInput, kms: 0 });
        expect(result.success).toBe(false);
    });

    it('should not require userId (userId comes from JWT)', () => {
        const result = createTripSchema.safeParse(validInput);
        expect(result.success).toBe(true);
    });

    it('should reject missing date', () => {
        const { date, ...rest } = validInput;
        const result = createTripSchema.safeParse(rest);
        expect(result.success).toBe(false);
    });

    it('should reject missing departureCity', () => {
        const { departureCity, ...rest } = validInput;
        const result = createTripSchema.safeParse(rest);
        expect(result.success).toBe(false);
    });

    it('should reject missing arrivalCity', () => {
        const { arrivalCity, ...rest } = validInput;
        const result = createTripSchema.safeParse(rest);
        expect(result.success).toBe(false);
    });

    it('should reject missing seats', () => {
        const { seats, ...rest } = validInput;
        const result = createTripSchema.safeParse(rest);
        expect(result.success).toBe(false);
    });

    it('should reject zero seats', () => {
        const result = createTripSchema.safeParse({ ...validInput, seats: 0 });
        expect(result.success).toBe(false);
    });

    it('should reject missing carId', () => {
        const { carId, ...rest } = validInput;
        const result = createTripSchema.safeParse(rest);
        expect(result.success).toBe(false);
    });
});
