import type { Context } from 'hono';
import { LoginUseCase } from '../../application/use-cases/auth/login.use-case.js';
import { RegisterUseCase } from '../../application/use-cases/auth/register.use-case.js';
import { container } from '../../lib/shared/di/container.js';
import { resultToResponse } from '../../lib/shared/utils/result-response.util.js';
import { loginSchema, registerSchema } from '../../application/schemas/auth.schema.js';

export async function register(c: Context): Promise<Response> {
	const body = await c.req.json();
	const validated = registerSchema.parse(body);

	const registerUseCase = container.resolve(RegisterUseCase);
	const result = await registerUseCase.execute(validated);

	return resultToResponse(c, result, 201);
}

export async function login(c: Context): Promise<Response> {
	const body = await c.req.json();
	const validated = loginSchema.parse(body);

	const loginUseCase = container.resolve(LoginUseCase);
	const result = await loginUseCase.execute(validated);

	return resultToResponse(c, result, 200);
}
