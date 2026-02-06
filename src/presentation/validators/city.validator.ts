import { z } from 'zod';

export const createCitySchema = z.object({
	ville: z.string().min(1, 'City name is required'),
	cp: z.string().min(1, 'Postal code is required'),
});

export type CreateCitySchemaType = z.infer<typeof createCitySchema>;
