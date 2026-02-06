import { z } from 'zod';

export const createCarSchema = z.object({
	modele: z.string().min(1, 'Model name is required'),
	marqueId: z.string().min(1, 'Brand ID is required'),
	immatriculation: z.string().min(1, 'Immatriculation is required'),
});

export const updateCarSchema = z.object({
	modele: z.string().min(1, 'Model name is required'),
	marqueId: z.string().min(1, 'Brand ID is required'),
	immatriculation: z.string().min(1, 'Immatriculation is required'),
});

export const patchCarSchema = z.object({
	modele: z.string().min(1).optional(),
	marqueId: z.string().min(1).optional(),
	immatriculation: z.string().min(1).optional(),
});

export type CreateCarSchemaType = z.infer<typeof createCarSchema>;
export type UpdateCarSchemaType = z.infer<typeof updateCarSchema>;
export type PatchCarSchemaType = z.infer<typeof patchCarSchema>;
