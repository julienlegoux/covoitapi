import { z } from 'zod';

export const profileSchema = z.object({
	firstName: z.string().min(1, 'First name is required'),
	lastName: z.string().min(1, 'Last name is required'),
	phone: z.string().min(10, 'Phone must be at least 10 characters'),
});

export type ProfileSchemaType = z.infer<typeof profileSchema>;
