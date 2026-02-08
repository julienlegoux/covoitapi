import { z } from 'zod';

export const registerSchema = z
	.object({
		email: z.email('Invalid email format'),
		password: z
			.string()
			.min(8, 'Password must be at least 8 characters')
			.regex(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
				'Password must contain at least one lowercase, one uppercase, and one number',
			),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword'],
	});

export const loginSchema = z.object({
	email: z.email('Invalid email format'),
	password: z.string().min(1, 'Password is required'),
});

export type RegisterSchemaType = z.infer<typeof registerSchema>;
export type LoginSchemaType = z.infer<typeof loginSchema>;
