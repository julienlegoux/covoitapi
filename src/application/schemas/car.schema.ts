import { z } from 'zod';

export const createCarSchema = z.object({
	model: z.string().min(1, 'Model name is required'),
	brandId: z.string().min(1, 'Brand ID is required'),
	licensePlate: z.string().min(1, 'License plate is required'),
});

export const updateCarSchema = z.object({
	model: z.string().min(1, 'Model name is required'),
	brandId: z.string().min(1, 'Brand ID is required'),
	licensePlate: z.string().min(1, 'License plate is required'),
});

export const patchCarSchema = z.object({
	model: z.string().min(1).optional(),
	brandId: z.string().min(1).optional(),
	licensePlate: z.string().min(1).optional(),
});

export type CreateCarSchemaType = z.infer<typeof createCarSchema>;
export type UpdateCarSchemaType = z.infer<typeof updateCarSchema>;
export type PatchCarSchemaType = z.infer<typeof patchCarSchema>;
