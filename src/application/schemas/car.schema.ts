/**
 * @module car.schema
 * Zod validation schemas for car management endpoints.
 * Provides schemas for creating, fully updating (PUT), and partially
 * updating (PATCH) a car entity associated with a driver.
 */

import { z } from 'zod';

/**
 * Schema for validating car creation input.
 *
 * Validation rules:
 * - `model` -- non-empty string for the car model name (e.g. "Corolla").
 * - `brandId` -- non-empty string identifier referencing an existing brand.
 * - `licensePlate` -- non-empty string for the vehicle license plate.
 */
export const createCarSchema = z.object({
	model: z.string().min(1, 'Model name is required'),
	brandId: z.string().min(1, 'Brand ID is required'),
	licensePlate: z.string().min(1, 'License plate is required'),
});

/**
 * Schema for validating a full car update (PUT) input.
 * All fields are required -- identical constraints to {@link createCarSchema}.
 *
 * Validation rules:
 * - `model` -- non-empty string for the car model name.
 * - `brandId` -- non-empty string identifier referencing an existing brand.
 * - `licensePlate` -- non-empty string for the vehicle license plate.
 */
export const updateCarSchema = z.object({
	model: z.string().min(1, 'Model name is required'),
	brandId: z.string().min(1, 'Brand ID is required'),
	licensePlate: z.string().min(1, 'License plate is required'),
});

/**
 * Schema for validating a partial car update (PATCH) input.
 * All fields are optional, but if provided they must be non-empty strings.
 *
 * Validation rules:
 * - `model` -- optional; if present, must be a non-empty string.
 * - `brandId` -- optional; if present, must be a non-empty string.
 * - `licensePlate` -- optional; if present, must be a non-empty string.
 */
export const patchCarSchema = z.object({
	model: z.string().min(1).optional(),
	brandId: z.string().min(1).optional(),
	licensePlate: z.string().min(1).optional(),
});

/** Inferred TypeScript type for a valid car creation request body. */
export type CreateCarSchemaType = z.infer<typeof createCarSchema>;

/** Inferred TypeScript type for a valid full car update (PUT) request body. */
export type UpdateCarSchemaType = z.infer<typeof updateCarSchema>;

/** Inferred TypeScript type for a valid partial car update (PATCH) request body. */
export type PatchCarSchemaType = z.infer<typeof patchCarSchema>;
