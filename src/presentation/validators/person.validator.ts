import { z } from 'zod';

export const createPersonSchema = z.object({
	prenom: z.string().min(1, 'First name is required'),
	nom: z.string().min(1, 'Last name is required'),
	tel: z.string().min(1, 'Phone is required'),
	email: z.email('Invalid email format'),
	password: z.string().min(8, 'Password must be at least 8 characters'),
	ville: z.string().optional(),
	voiture: z.string().optional(),
});

export const updatePersonSchema = z.object({
	prenom: z.string().min(1, 'First name is required'),
	nom: z.string().min(1, 'Last name is required'),
	tel: z.string().min(1, 'Phone is required'),
	email: z.email('Invalid email format'),
});

export const patchPersonSchema = z.object({
	tel: z.string().min(1).optional(),
	email: z.email('Invalid email format').optional(),
});

export type CreatePersonSchemaType = z.infer<typeof createPersonSchema>;
export type UpdatePersonSchemaType = z.infer<typeof updatePersonSchema>;
export type PatchPersonSchemaType = z.infer<typeof patchPersonSchema>;
