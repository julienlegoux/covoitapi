import { z } from 'zod';

export const vpRegisterSchema = z.object({
	email: z.email('Invalid email format'),
	password: z
		.string()
		.min(8, 'Password must be at least 8 characters')
		.regex(
			/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
			'Password must contain at least one lowercase, one uppercase, and one number',
		),
});

export const vpAddressSchema = z.object({
	street_number: z.string().default(''),
	street_name: z.string().default(''),
	postal_code: z.string().default(''),
	city_name: z.string().min(1, 'City name is required'),
});

export const vpCreatePersonSchema = z.object({
	firstname: z.string().min(1, 'First name is required'),
	lastname: z.string().min(1, 'Last name is required'),
	phone: z.string().min(10, 'Phone must be at least 10 characters'),
	pseudo: z.string().optional(),
});

export const vpPatchPersonSchema = z.object({
	firstname: z.string().min(1).optional(),
	lastname: z.string().min(1).optional(),
	phone: z.string().min(10).optional(),
	pseudo: z.string().optional(),
	status: z.string().optional(),
});

export const vpCreateCarSchema = z.object({
	carregistration: z.string().min(1, 'Car registration is required'),
	model: z.string().min(1, 'Model name is required'),
	brand: z.string().min(1, 'Brand name is required'),
	seats: z.number().int().positive('Seats must be positive').optional(),
});

export const vpCreateBrandSchema = z.object({
	name: z.string().min(1, 'Brand name is required'),
});

export const vpCreateTripSchema = z.object({
	kms: z.number().int().positive('Kilometers must be positive'),
	person_id: z.number().int().positive('Person ID must be a positive integer').optional(),
	trip_datetime: z.string().min(1, 'Trip datetime is required'),
	available_seats: z.number().int().positive('Seats must be positive'),
	car_id: z.string().min(1, 'Car ID is required').optional(),
	starting_address: vpAddressSchema,
	arrival_address: vpAddressSchema,
});

export const vpPatchTripSchema = z.object({
	kms: z.number().int().positive().optional(),
	trip_datetime: z.string().optional(),
	available_seats: z.number().int().positive().optional(),
	starting_address: vpAddressSchema.optional(),
	arrival_address: vpAddressSchema.optional(),
});

export const vpTripInscriptionSchema = z.object({
	person_id: z.string().uuid('Person ID must be a valid UUID'),
});
