import { z } from 'zod';

export const createDriverSchema = z.object({
	permis: z.string().min(1, 'Driver license is required'),
	idpers: z.string().min(1, 'User ID is required'),
});

export type CreateDriverSchemaType = z.infer<typeof createDriverSchema>;
