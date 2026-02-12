/**
 * @module travel.schema
 * Zod validation schemas for carpooling travel (ride) endpoints.
 * Provides schemas for creating a new travel offer and for querying
 * available travels with optional filters. The driver's user ID is
 * extracted from the JWT token and is not part of these schemas.
 */

import { z } from 'zod';

/**
 * Schema for validating travel creation input.
 *
 * Validation rules:
 * - `kms` -- positive integer representing the trip distance in kilometers.
 * - `date` -- non-empty string for the travel date (e.g. "2025-06-15").
 * - `departureCity` -- non-empty string identifier for the departure city.
 * - `arrivalCity` -- non-empty string identifier for the arrival city.
 * - `seats` -- positive integer for the number of available passenger seats.
 * - `carId` -- non-empty string identifier referencing the driver's car.
 *
 * Note: The driver's user ID is not included; it is resolved from the
 * authenticated JWT context at the controller level.
 */
export const createTravelSchema = z.object({
	kms: z.number().int().positive('Kilometers must be positive'),
	date: z.string().min(1, 'Date is required'),
	departureCity: z.string().min(1, 'Departure city is required'),
	arrivalCity: z.string().min(1, 'Arrival city is required'),
	seats: z.number().int().positive('Seats must be positive'),
	carId: z.string().min(1, 'Car ID is required'),
});

/**
 * Schema for validating travel search query parameters.
 * All fields are optional, allowing flexible filtering.
 *
 * Validation rules:
 * - `departureCity` -- optional string to filter by departure city.
 * - `arrivalCity` -- optional string to filter by arrival city.
 * - `date` -- optional string to filter by travel date.
 */
export const findTravelQuerySchema = z.object({
	departureCity: z.string().optional(),
	arrivalCity: z.string().optional(),
	date: z.string().optional(),
});

/** Inferred TypeScript type for a valid travel creation request body. */
export type CreateTravelSchemaType = z.infer<typeof createTravelSchema>;

/** Inferred TypeScript type for valid travel search query parameters. */
export type FindTravelQueryType = z.infer<typeof findTravelQuerySchema>;
