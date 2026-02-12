/**
 * @module driver.schema
 * Zod validation schema for driver registration endpoints.
 * Validates the input required to register a user as a driver
 * by providing their driver license information.
 */

import { z } from 'zod';

/**
 * Schema for validating driver creation input.
 *
 * Validation rules:
 * - `driverLicense` -- non-empty string for the driver's license number or identifier.
 */
export const createDriverSchema = z.object({
	driverLicense: z.string().min(1, 'Driver license is required'),
});

/** Inferred TypeScript type for a valid driver registration request body. */
export type CreateDriverSchemaType = z.infer<typeof createDriverSchema>;
