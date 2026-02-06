import { z } from 'zod';

export const createBrandSchema = z.object({
	nom: z.string().min(1, 'Brand name is required'),
});

export type CreateBrandSchemaType = z.infer<typeof createBrandSchema>;
