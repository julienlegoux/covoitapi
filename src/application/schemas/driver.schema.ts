import { z } from 'zod';

export const createDriverSchema = z.object({
	driverLicense: z.string().min(1, 'Driver license is required'),
});

export type CreateDriverSchemaType = z.infer<typeof createDriverSchema>;
