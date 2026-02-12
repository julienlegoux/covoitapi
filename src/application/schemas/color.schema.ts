/**
 * @module color.schema
 * Zod validation schemas for car color management endpoints.
 * Provides schemas for creating a new color and partially updating
 * an existing color. Colors are associated with cars in the system.
 */

import { z } from 'zod';

/**
 * Schema for validating color creation input.
 *
 * Validation rules:
 * - `name` -- non-empty string for the color name (e.g. "Red").
 * - `hex` -- must match the 6-digit hex color format `#RRGGBB` (case-insensitive).
 */
export const ColorSchema = z.object({
	name: z.string().min(1),
	hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
});

export const createColorSchema = ColorSchema;

/**
 * Schema for validating a partial color update input.
 * All fields are optional, but if provided they must satisfy the same
 * constraints as {@link ColorSchema}.
 *
 * Validation rules:
 * - `name` -- optional; if present, must be a non-empty string.
 * - `hex` -- optional; if present, must match `#RRGGBB` hex format.
 */
export const updateColorSchema = ColorSchema.partial();

/** Inferred TypeScript type for a valid color creation request body. */
export type CreateColorSchemaType = z.infer<typeof ColorSchema>;

/** Inferred TypeScript type for a valid color update request body. */
export type UpdateColorSchemaType = z.infer<typeof updateColorSchema>;
