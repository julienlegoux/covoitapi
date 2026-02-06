import { z } from 'zod';

export const createRouteSchema = z.object({
	kms: z.number().int().positive('Kilometers must be positive'),
	idpers: z.string().min(1, 'Driver user ID is required'),
	dateT: z.string().min(1, 'Date is required'),
	villeD: z.string().min(1, 'Departure city is required'),
	villeA: z.string().min(1, 'Arrival city is required'),
	seats: z.number().int().positive('Seats must be positive'),
	carId: z.string().min(1, 'Car ID is required'),
});

export type CreateRouteSchemaType = z.infer<typeof createRouteSchema>;
