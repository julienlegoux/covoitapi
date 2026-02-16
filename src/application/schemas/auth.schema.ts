/**
 * @module auth.schema
 * Zod validation schemas for authentication-related API endpoints.
 * Covers user registration (with password strength and confirmation),
 * login credentials, and the authentication response payload.
 */

import { z } from 'zod';

/**
 * Schema for validating user registration input.
 *
 * Validation rules:
 * - `email` -- must be a valid email address.
 * - `password` -- minimum 8 characters; must contain at least one lowercase letter,
 *   one uppercase letter, and one digit.
 * - `confirmPassword` -- must exactly match `password` (enforced via `.refine()`).
 */
export const registerSchema = z
	.object({
		email: z.email('Invalid email format'),
		password: z
			.string()
			.min(8, 'Password must be at least 8 characters')
			.regex(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
				'Password must contain at least one lowercase, one uppercase, and one number',
			),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword'],
	});

/**
 * Schema for validating user login input.
 *
 * Validation rules:
 * - `email` -- must be a valid email address.
 * - `password` -- must be a non-empty string (no strength requirements at login).
 */
export const loginSchema = z.object({
	email: z.email('Invalid email format'),
	password: z.string().min(1, 'Password is required'),
});

/**
 * Schema for validating the authentication response returned after
 * a successful login or registration.
 *
 * Validation rules:
 * - `userId` -- must be a valid UUID string.
 * - `token` -- must be a non-empty string (JWT).
 */
export const authResponseSchema = z.object({
	userId: z.uuid(),
	token: z.string(),
});

/** Inferred TypeScript type for a valid registration request body. */
export type RegisterSchemaType = z.infer<typeof registerSchema>;

/** Inferred TypeScript type for a valid login request body. */
export type LoginSchemaType = z.infer<typeof loginSchema>;

/** Inferred TypeScript type for the authentication response payload (userId + JWT token). */
export type AuthResponseType = z.infer<typeof authResponseSchema>;
