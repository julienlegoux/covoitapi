/**
 * @module AuthController
 * Handles authentication endpoints for user registration and login.
 * Validates request bodies with Zod schemas, delegates to use cases resolved
 * from the tsyringe DI container, and converts Result objects to HTTP responses.
 *
 * All routes in this controller are public (no auth middleware required).
 */
import type { Context } from 'hono';
import { LoginUseCase } from '../../application/use-cases/auth/login.use-case.js';
import { RegisterUseCase } from '../../application/use-cases/auth/register.use-case.js';
import { container } from '../../lib/shared/di/container.js';
import { resultToResponse } from '../../lib/shared/utils/result-response.util.js';
import { loginSchema, registerSchema } from '../../application/schemas/auth.schema.js';

/**
 * Registers a new user account.
 *
 * **POST /api/auth/register** -- Public
 *
 * @param c - Hono request context containing the JSON body
 * @returns 201 with `{ success: true, data: { userId, token } }` on success,
 *          or an error response (e.g. 409 USER_ALREADY_EXISTS).
 *          Throws ZodError (caught by error-handler middleware) on invalid input.
 *
 * Request body: `{ email: string, password: string, confirmPassword: string }`
 */
export async function register(c: Context): Promise<Response> {
	const body = await c.req.json();
	const validated = registerSchema.parse(body);

	const registerUseCase = container.resolve(RegisterUseCase);
	const result = await registerUseCase.execute(validated);

	return resultToResponse(c, result, 201);
}

/**
 * Authenticates a user and returns a JWT token.
 *
 * **POST /api/auth/login** -- Public
 *
 * @param c - Hono request context containing the JSON body
 * @returns 200 with `{ success: true, data: { userId, token } }` on success,
 *          or an error response (e.g. 401 INVALID_CREDENTIALS).
 *          Throws ZodError (caught by error-handler middleware) on invalid input.
 *
 * Request body: `{ email: string, password: string }`
 */
export async function login(c: Context): Promise<Response> {
	const body = await c.req.json();
	const validated = loginSchema.parse(body);

	const loginUseCase = container.resolve(LoginUseCase);
	const result = await loginUseCase.execute(validated);

	return resultToResponse(c, result, 200);
}
