/**
 * @module brand.schema
 * Zod validation schema for car brand management endpoints.
 * Validates the input required to create a new car brand (e.g. Toyota, Peugeot).
 */

import { z } from 'zod';

/**
 * Schema for validating car brand creation input.
 *
 * Validation rules:
 * - `name` -- non-empty string representing the brand name.
 */
export const createBrandSchema = z.object({
	name: z.string().min(1, 'Brand name is required'),
});

/** Inferred TypeScript type for a valid brand creation request body. */
export type CreateBrandSchemaType = z.infer<typeof createBrandSchema>;
