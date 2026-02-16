/**
 * @module inscription.schema
 * Zod validation schema for trip inscription (booking) endpoints.
 * Validates the input required for a passenger to sign up for an
 * existing carpooling trip. The user ID is extracted from the JWT
 * token and is not part of this schema.
 */

import { z } from 'zod';

/**
 * Schema for validating trip inscription (booking) input.
 *
 * Validation rules:
 * - `tripId` -- non-empty string identifier referencing the trip to join.
 *
 * Note: The passenger's user ID is not included here; it is resolved
 * from the authenticated JWT context at the controller level.
 */
export const createInscriptionSchema = z.object({
	tripId: z.string().min(1, 'Trip ID is required'),
});

/** Inferred TypeScript type for a valid inscription (booking) request body. */
export type CreateInscriptionSchemaType = z.infer<typeof createInscriptionSchema>;
