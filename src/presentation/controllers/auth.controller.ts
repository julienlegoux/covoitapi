import type { Context } from 'hono';
import type { LoginInput, RegisterInput } from '../../application/dtos/auth.dto.js';
import { LoginUseCase } from '../../application/use-cases/auth/login.use-case.js';
import { RegisterUseCase } from '../../application/use-cases/auth/register.use-case.js';
import { container } from '../../lib/shared/di/container.js';
import { resultToResponse } from '../../lib/shared/utils/result-response.util.js';
import { loginSchema, registerSchema } from '../validators/auth.validator.js';

export async function register(c: Context): Promise<Response> {
	const body = await c.req.json();
	const validated = registerSchema.parse(body);

	const input: RegisterInput = {
		email: validated.email,
		password: validated.password,
		confirmPassword: validated.confirmPassword,
	};

	const registerUseCase = container.resolve(RegisterUseCase);
	const result = await registerUseCase.execute(input);

	return resultToResponse(c, result, 201);
}

export async function login(c: Context): Promise<Response> {
	const body = await c.req.json();
	const validated = loginSchema.parse(body);

	const input: LoginInput = {
		email: validated.email,
		password: validated.password,
	};

	const loginUseCase = container.resolve(LoginUseCase);
	const result = await loginUseCase.execute(input);

	return resultToResponse(c, result, 200);
}
