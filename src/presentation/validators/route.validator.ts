import { z } from 'zod';

export const createRouteSchema = z.object({
	kms: z.number().int().positive('Kilometers must be positive'),
	date: z.string().min(1, 'Date is required'),
	departureCity: z.string().min(1, 'Departure city is required'),
	arrivalCity: z.string().min(1, 'Arrival city is required'),
	seats: z.number().int().positive('Seats must be positive'),
	carId: z.string().min(1, 'Car ID is required'),
});

export type CreateRouteSchemaType = z.infer<typeof createRouteSchema>;
