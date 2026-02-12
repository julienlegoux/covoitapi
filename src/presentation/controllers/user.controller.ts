/**
 * @module UserController
 * Handles user profile management, listing, and GDPR-compliant anonymization.
 * All endpoints require authentication. Admin-only endpoints include listing
 * all users and anonymizing other users. Users can update their own profile
 * and request self-anonymization.
 */
import type { Context } from 'hono';
import { AnonymizeUserUseCase } from '../../application/use-cases/user/anonymize-user.use-case.js';
import { GetUserUseCase } from '../../application/use-cases/user/get-user.use-case.js';
import { ListUsersUseCase } from '../../application/use-cases/user/list-users.use-case.js';
import { UpdateUserUseCase } from '../../application/use-cases/user/update-user.use-case.js';
import { container } from '../../lib/shared/di/container.js';
import { resultToResponse } from '../../lib/shared/utils/result-response.util.js';
import { profileSchema } from '../../application/schemas/user.schema.js';

/**
 * Lists all users.
 *
 * **GET /api/users** -- Auth required, ADMIN only
 *
 * @param c - Hono request context
 * @returns 200 with `{ success: true, data: PublicUserEntity[] }`
 */
export async function listUsers(c: Context): Promise<Response> {
	const useCase = container.resolve(ListUsersUseCase);
	const result = await useCase.execute();
	return resultToResponse(c, result);
}

/**
 * Gets a single user by their UUID.
 *
 * **GET /api/users/:id** -- Auth required, USER+
 *
 * @param c - Hono request context with `id` route parameter (UUID)
 * @returns 200 with `{ success: true, data: PublicUserEntity }` on success,
 *          or an error response (e.g. 404 USER_NOT_FOUND).
 */
export async function getUser(c: Context): Promise<Response> {
	const id = c.req.param('id');
	const useCase = container.resolve(GetUserUseCase);
	const result = await useCase.execute(id);
	return resultToResponse(c, result);
}

/**
 * Updates the authenticated user's profile.
 *
 * **PATCH /api/users/me** -- Auth required, USER+
 *
 * Reads `userId` from the Hono context (set by authMiddleware) to identify
 * which user's profile to update.
 *
 * @param c - Hono request context with JSON body and `userId` set on context
 * @returns 200 with `{ success: true, data: PublicUserEntity }` on success,
 *          or an error response (e.g. 404 USER_NOT_FOUND).
 *          Throws ZodError on invalid input.
 *
 * Request body: `{ firstName: string, lastName: string, phone: string }`
 */
export async function updateProfile(c: Context): Promise<Response> {
	const body = await c.req.json();
	const validated = profileSchema.parse(body);

	const userId = c.get('userId');

	const useCase = container.resolve(UpdateUserUseCase);
	const result = await useCase.execute(userId, {
		firstName: validated.firstName,
		lastName: validated.lastName,
		phone: validated.phone,
	});
	return resultToResponse(c, result);
}

/**
 * Anonymizes the authenticated user's own data (GDPR self-service deletion).
 *
 * **DELETE /api/users/me** -- Auth required, USER+
 *
 * Reads `userId` from the Hono context (set by authMiddleware).
 *
 * @param c - Hono request context with `userId` set on context
 * @returns 204 (no content) on success,
 *          or an error response on failure.
 */
export async function anonymizeMe(c: Context): Promise<Response> {
	const userId = c.get('userId');
	const useCase = container.resolve(AnonymizeUserUseCase);
	const result = await useCase.execute(userId);
	if (!result.success) {
		return resultToResponse(c, result);
	}
	return c.body(null, 204);
}

/**
 * Anonymizes a user by their UUID (admin action).
 *
 * **DELETE /api/users/:id** -- Auth required, ADMIN only
 *
 * @param c - Hono request context with `id` route parameter (UUID)
 * @returns 204 (no content) on success,
 *          or an error response (e.g. 404 USER_NOT_FOUND).
 */
export async function anonymizeUser(c: Context): Promise<Response> {
	const id = c.req.param('id');
	const useCase = container.resolve(AnonymizeUserUseCase);
	const result = await useCase.execute(id);
	if (!result.success) {
		return resultToResponse(c, result);
	}
	return c.body(null, 204);
}
