/**
 * @module inscription.schema.test
 * Unit tests for the inscription Zod schema (createInscriptionSchema).
 * Verifies that travelId is required and non-empty, and that userId
 * is not required in the schema (it comes from the JWT token).
 */

import { describe, it, expect } from 'vitest';
import { createInscriptionSchema } from './inscription.schema.js';

/** Tests for createInscriptionSchema -- validates travelId presence and confirms userId is not required. */
describe('createInscriptionSchema', () => {
	const validInput = { travelId: 'route-1' };

	it('should accept valid inscription input', () => {
		const result = createInscriptionSchema.safeParse(validInput);
		expect(result.success).toBe(true);
	});

	it('should reject missing travelId', () => {
		const result = createInscriptionSchema.safeParse({});
		expect(result.success).toBe(false);
	});

	it('should reject empty travelId', () => {
		const result = createInscriptionSchema.safeParse({ travelId: '' });
		expect(result.success).toBe(false);
	});

	it('should not require userId (userId comes from JWT)', () => {
		const result = createInscriptionSchema.safeParse({ travelId: 'route-1' });
		expect(result.success).toBe(true);
	});
});
