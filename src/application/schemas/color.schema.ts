import { z } from 'zod';

export const createColorSchema = z.object({
	name: z.string().min(1),
	hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
});

export const updateColorSchema = z.object({
	name: z.string().min(1).optional(),
	hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color').optional(),
});

export type CreateColorSchemaType = z.infer<typeof createColorSchema>;
export type UpdateColorSchemaType = z.infer<typeof updateColorSchema>;
