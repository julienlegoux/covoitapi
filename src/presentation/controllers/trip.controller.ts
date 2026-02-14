/**
 * @module TripController
 * Handles trip CRUD operations for the carpooling platform.
 * All endpoints require authentication. Listing, searching, and getting require
 * USER+ role; creation and deletion require DRIVER+ role.
 */
import type { Context } from 'hono';
import { CreateTripUseCase } from '../../application/use-cases/trip/create-trip.use-case.js';
import { DeleteTripUseCase } from '../../application/use-cases/trip/delete-trip.use-case.js';
import { FindTripUseCase } from '../../application/use-cases/trip/find-trip.use-case.js';
import { GetTripUseCase } from '../../application/use-cases/trip/get-trip.use-case.js';
import { ListTripsUseCase } from '../../application/use-cases/trip/list-trips.use-case.js';
import { container } from '../../lib/shared/di/container.js';
import { resultToResponse } from '../../lib/shared/utils/result-response.util.js';
import { createTripSchema, findTripQuerySchema } from '../../application/schemas/trip.schema.js';
import type { CreateTripSchemaType } from '../../application/schemas/trip.schema.js';
import type { WithAuthContext } from '../../lib/shared/types/auth-context.js';
import { uuidSchema } from '../../application/schemas/common.schema.js';

/**
 * Lists all available trips.
 *
 * **GET /api/trips** -- Auth required, USER+
 *
 * @param c - Hono request context
 * @returns 200 with `{ success: true, data: Trip[] }`
 */
export async function listTrips(c: Context): Promise<Response> {
    const useCase = container.resolve(ListTripsUseCase);
    const result = await useCase.execute();
    return resultToResponse(c, result);
}

/**
 * Gets a single trip by its UUID.
 *
 * **GET /api/trips/:id** -- Auth required, USER+
 *
 * @param c - Hono request context with `id` route parameter (UUID)
 * @returns 200 with `{ success: true, data: Trip }` on success,
 *          or an error response (e.g. 404 TRIP_NOT_FOUND).
 */
export async function getTrip(c: Context): Promise<Response> {
    const id = uuidSchema.parse(c.req.param('id'));
    const useCase = container.resolve(GetTripUseCase);
    const result = await useCase.execute(id);
    return resultToResponse(c, result);
}

/**
 * Searches for trips by departure city, arrival city, and/or date.
 *
 * **GET /api/trips/search** -- Auth required, USER+
 *
 * @param c - Hono request context with optional query params:
 *            `departureCity`, `arrivalCity`, `date` (ISO date string)
 * @returns 200 with `{ success: true, data: Trip[] }` matching the search criteria
 */
export async function findTrip(c: Context): Promise<Response> {
    const validated = findTripQuerySchema.parse({
        departureCity: c.req.query('departureCity'),
        arrivalCity: c.req.query('arrivalCity'),
        date: c.req.query('date'),
    });

    const useCase = container.resolve(FindTripUseCase);
    const result = await useCase.execute(validated);
    return resultToResponse(c, result);
}

/**
 * Creates a new trip. The authenticated user is set as the driver.
 *
 * **POST /api/trips** -- Auth required, DRIVER+
 *
 * Reads `userId` from the Hono context (set by authMiddleware) and merges it
 * with the validated request body.
 *
 * @param c - Hono request context with JSON body and `userId` set on context
 * @returns 201 with `{ success: true, data: Trip }` on success.
 *          Throws ZodError on invalid input.
 *
 * Request body: `{ kms: number, date: string, departureCity: string, arrivalCity: string, seats: number, carId: string }`
 */
export async function createTrip(c: Context): Promise<Response> {
    const body = await c.req.json();
    const validated = createTripSchema.parse(body);

    const input: WithAuthContext<CreateTripSchemaType> = {
        ...validated,
        userId: c.get('userId'),
    };

    const useCase = container.resolve(CreateTripUseCase);
    const result = await useCase.execute(input);
    return resultToResponse(c, result, 201);
}

/**
 * Deletes a trip by its UUID.
 *
 * **DELETE /api/trips/:id** -- Auth required, DRIVER+
 *
 * @param c - Hono request context with `id` route parameter (UUID)
 * @returns 204 (no content) on success,
 *          or an error response (e.g. 404 TRIP_NOT_FOUND).
 */
export async function deleteTrip(c: Context): Promise<Response> {
    const id = uuidSchema.parse(c.req.param('id'));
    const useCase = container.resolve(DeleteTripUseCase);
    const result = await useCase.execute({ id, userId: c.get('userId') });
    if (!result.success) {
        return resultToResponse(c, result);
    }
    return c.body(null, 204);
}
