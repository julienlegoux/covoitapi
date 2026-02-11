import { z } from 'zod';

export const createInscriptionSchema = z.object({
	travelId: z.string().min(1, 'Route ID is required'),
});

export type CreateInscriptionSchemaType = z.infer<typeof createInscriptionSchema>;
