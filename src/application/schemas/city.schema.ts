import { z } from 'zod';

export const createCitySchema = z.object({
	cityName: z.string().min(1, 'City name is required'),
	zipcode: z.string().min(1, 'Postal code is required'),
});

export type CreateCitySchemaType = z.infer<typeof createCitySchema>;
