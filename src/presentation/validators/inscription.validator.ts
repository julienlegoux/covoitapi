import { z } from 'zod';

export const createInscriptionSchema = z.object({
	idpers: z.string().min(1, 'User ID is required'),
	idtrajet: z.string().min(1, 'Route ID is required'),
});

export type CreateInscriptionSchemaType = z.infer<typeof createInscriptionSchema>;
