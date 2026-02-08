import { z } from 'zod';

export const createPersonSchema = z.object({
	firstName: z.string().min(1, 'First name is required'),
	lastName: z.string().min(1, 'Last name is required'),
	phone: z.string().min(1, 'Phone is required'),
	email: z.email('Invalid email format'),
	password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const updatePersonSchema = z.object({
	firstName: z.string().min(1, 'First name is required'),
	lastName: z.string().min(1, 'Last name is required'),
	phone: z.string().min(1, 'Phone is required'),
	email: z.email('Invalid email format'),
});

export const patchPersonSchema = z.object({
	phone: z.string().min(1).optional(),
	email: z.email('Invalid email format').optional(),
});

export type CreatePersonSchemaType = z.infer<typeof createPersonSchema>;
export type UpdatePersonSchemaType = z.infer<typeof updatePersonSchema>;
export type PatchPersonSchemaType = z.infer<typeof patchPersonSchema>;
