import type { Context } from 'hono';
import { RegisterUseCase } from '../../../application/use-cases/auth/register.use-case.js';
import { LoginUseCase } from '../../../application/use-cases/auth/login.use-case.js';
import { loginSchema } from '../../../application/schemas/auth.schema.js';
import { container } from '../../../lib/shared/di/container.js';
import { resultToResponse } from '../../../lib/shared/utils/result-response.util.js';
import { vpRegisterSchema } from '../schemas.js';

export async function vpRegister(c: Context): Promise<Response> {
	const body = await c.req.json();
	const validated = vpRegisterSchema.parse(body);
	const useCase = container.resolve(RegisterUseCase);
	const result = await useCase.execute({
		email: validated.email,
		password: validated.password,
		confirmPassword: validated.password,
	});
	return resultToResponse(c, result, 201);
}

export async function vpLogin(c: Context): Promise<Response> {
	const body = await c.req.json();
	const validated = loginSchema.parse(body);
	const useCase = container.resolve(LoginUseCase);
	const result = await useCase.execute(validated);
	return resultToResponse(c, result);
}
