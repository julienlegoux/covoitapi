/**
 * @module user.schema
 * Zod validation schema for user profile endpoints.
 * Validates the input required to create or update a user's profile
 * information (separate from authentication credentials).
 */

import { z } from 'zod';

/**
 * Schema for validating user profile input.
 *
 * Validation rules:
 * - `firstName` -- non-empty string for the user's first name.
 * - `lastName` -- non-empty string for the user's last name.
 * - `phone` -- string with a minimum length of 10 characters to accommodate
 *   standard phone number formats (e.g. "0612345678" or "+33612345678").
 */
export const profileSchema = z.object({
	firstName: z.string().min(1, 'First name is required'),
	lastName: z.string().min(1, 'Last name is required'),
	phone: z.string().min(10, 'Phone must be at least 10 characters'),
});

/** Inferred TypeScript type for a valid user profile request body. */
export type ProfileSchemaType = z.infer<typeof profileSchema>;
