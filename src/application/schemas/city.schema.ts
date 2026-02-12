/**
 * @module city.schema
 * Zod validation schema for city management endpoints.
 * Validates the input required to create a new city entry used as
 * a departure or arrival point for carpooling travels.
 */

import { z } from 'zod';

/**
 * Schema for validating city creation input.
 *
 * Validation rules:
 * - `cityName` -- non-empty string for the city name (e.g. "Paris").
 * - `zipcode` -- non-empty string for the postal / zip code (e.g. "75000").
 */
export const createCitySchema = z.object({
	cityName: z.string().min(1, 'City name is required'),
	zipcode: z.string().min(1, 'Postal code is required'),
});

/** Inferred TypeScript type for a valid city creation request body. */
export type CreateCitySchemaType = z.infer<typeof createCitySchema>;
