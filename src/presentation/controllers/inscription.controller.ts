/**
 * @module InscriptionController
 * Handles passenger inscriptions (sign-ups) to carpooling trips.
 * Provides listing of all inscriptions, per-user inscriptions, per-trip passengers,
 * creation, and deletion. All endpoints require authentication with USER+ role.
 *
 * Some handlers are mounted as nested resource routes in the main router
 * (e.g. GET /api/users/:id/inscriptions, GET /api/trips/:id/passengers).
 */
import type { Context } from 'hono';
import { CreateInscriptionUseCase } from '../../application/use-cases/inscription/create-inscription.use-case.js';
import { DeleteInscriptionUseCase } from '../../application/use-cases/inscription/delete-inscription.use-case.js';
import { ListInscriptionsUseCase } from '../../application/use-cases/inscription/list-inscriptions.use-case.js';
import { ListTripPassengersUseCase } from '../../application/use-cases/inscription/list-trip-passengers.use-case.js';
import { ListUserInscriptionsUseCase } from '../../application/use-cases/inscription/list-user-inscriptions.use-case.js';
import { container } from '../../lib/shared/di/container.js';
import { paginationSchema } from '../../lib/shared/utils/pagination.util.js';
import { resultToResponse } from '../../lib/shared/utils/result-response.util.js';
import { createInscriptionSchema } from '../../application/schemas/inscription.schema.js';
import type { CreateInscriptionSchemaType } from '../../application/schemas/inscription.schema.js';
import type { WithAuthContext } from '../../lib/shared/types/auth-context.js';
import { uuidSchema } from '../../application/schemas/common.schema.js';

/**
 * Lists all inscriptions with pagination.
 *
 * **GET /api/inscriptions** -- Auth required, USER+
 *
 * @param c - Hono request context with optional `page` and `limit` query params
 * @returns 200 with `{ success: true, data: { data: Inscription[], meta: PaginationMeta } }`
 */
export async function listInscriptions(c: Context): Promise<Response> {
	const pagination = paginationSchema.parse({
		page: c.req.query('page'),
		limit: c.req.query('limit'),
	});
	const useCase = container.resolve(ListInscriptionsUseCase);
	const result = await useCase.execute(pagination);
	return resultToResponse(c, result);
}

/**
 * Lists all inscriptions for a specific user with pagination.
 * Users can only view their own inscriptions unless they have ADMIN role.
 *
 * **GET /api/users/:id/inscriptions** -- Auth required, USER+ (own inscriptions or ADMIN)
 *
 * @param c - Hono request context with `id` route parameter (user UUID)
 *            and optional `page`/`limit` query params
 * @returns 200 with `{ success: true, data: { data: Inscription[], meta: PaginationMeta } }`,
 *          or 403 if requesting another user's inscriptions without ADMIN role.
 */
export async function listUserInscriptions(c: Context): Promise<Response> {
	const userId = uuidSchema.parse(c.req.param('id'));
	const requestingUserId = c.get('userId');
	const role = c.get('role');

	if (userId !== requestingUserId && role !== 'ADMIN') {
		return c.json(
			{ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
			403,
		);
	}

	const pagination = paginationSchema.parse({
		page: c.req.query('page'),
		limit: c.req.query('limit'),
	});
	const useCase = container.resolve(ListUserInscriptionsUseCase);
	const result = await useCase.execute(userId, pagination);
	return resultToResponse(c, result);
}

/**
 * Lists all passengers inscribed to a specific trip with pagination.
 *
 * **GET /api/trips/:id/passengers** -- Auth required, USER+
 *
 * @param c - Hono request context with `id` route parameter (trip UUID)
 *            and optional `page`/`limit` query params
 * @returns 200 with `{ success: true, data: { data: Passenger[], meta: PaginationMeta } }`
 */
export async function listTripPassengers(c: Context): Promise<Response> {
	const tripId = uuidSchema.parse(c.req.param('id'));
	const pagination = paginationSchema.parse({
		page: c.req.query('page'),
		limit: c.req.query('limit'),
	});
	const useCase = container.resolve(ListTripPassengersUseCase);
	const result = await useCase.execute(tripId, pagination);
	return resultToResponse(c, result);
}

/**
 * Creates a new inscription (signs up the authenticated user for a trip).
 *
 * **POST /api/inscriptions** -- Auth required, USER+
 *
 * Reads `userId` from the Hono context (set by authMiddleware) and merges it
 * with the validated request body.
 *
 * @param c - Hono request context with JSON body and `userId` set on context
 * @returns 201 with `{ success: true, data: Inscription }` on success,
 *          or an error response (e.g. 404 TRIP_NOT_FOUND).
 *          Throws ZodError on invalid input.
 *
 * Request body: `{ tripId: string }`
 */
export async function createInscription(c: Context): Promise<Response> {
	const body = await c.req.json();
	const validated = createInscriptionSchema.parse(body);

	const input: WithAuthContext<CreateInscriptionSchemaType> = {
		...validated,
		userId: c.get('userId'),
	};

	const useCase = container.resolve(CreateInscriptionUseCase);
	const result = await useCase.execute(input);
	return resultToResponse(c, result, 201);
}

/**
 * Deletes an inscription by its UUID.
 *
 * **DELETE /api/inscriptions/:id** -- Auth required, USER+
 *
 * @param c - Hono request context with `id` route parameter (UUID)
 * @returns 204 (no content) on success,
 *          or an error response (e.g. 404 INSCRIPTION_NOT_FOUND).
 */
export async function deleteInscription(c: Context): Promise<Response> {
	const id = uuidSchema.parse(c.req.param('id'));
	const useCase = container.resolve(DeleteInscriptionUseCase);
	const result = await useCase.execute({ id, userId: c.get('userId') });
	if (!result.success) {
		return resultToResponse(c, result);
	}
	return c.body(null, 204);
}
