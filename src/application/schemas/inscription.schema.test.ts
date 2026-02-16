/**
 * @module inscription.schema.test
 * Unit tests for the inscription Zod schema (createInscriptionSchema).
 * Verifies that tripId is required and non-empty, and that userId
 * is not required in the schema (it comes from the JWT token).
 */

import { describe, it, expect } from 'vitest';
import { createInscriptionSchema } from './inscription.schema.js';

/** Tests for createInscriptionSchema -- validates tripId presence and confirms userId is not required. */
describe('createInscriptionSchema', () => {
	const validInput = { tripId: 'trip-1' };

	it('should accept valid inscription input', () => {
		const result = createInscriptionSchema.safeParse(validInput);
		expect(result.success).toBe(true);
	});

	it('should reject missing tripId', () => {
		const result = createInscriptionSchema.safeParse({});
		expect(result.success).toBe(false);
	});

	it('should reject empty tripId', () => {
		const result = createInscriptionSchema.safeParse({ tripId: '' });
		expect(result.success).toBe(false);
	});

	it('should not require userId (userId comes from JWT)', () => {
		const result = createInscriptionSchema.safeParse({ tripId: 'trip-1' });
		expect(result.success).toBe(true);
	});
});
