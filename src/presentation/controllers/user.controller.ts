import type { Context } from 'hono';
import { AnonymizeUserUseCase } from '../../application/use-cases/user/anonymize-user.use-case.js';
import { GetUserUseCase } from '../../application/use-cases/user/get-user.use-case.js';
import { ListUsersUseCase } from '../../application/use-cases/user/list-users.use-case.js';
import { UpdateUserUseCase } from '../../application/use-cases/user/update-user.use-case.js';
import { container } from '../../lib/shared/di/container.js';
import { resultToResponse } from '../../lib/shared/utils/result-response.util.js';
import { profileSchema } from '../validators/user.validator.js';

export async function listUsers(c: Context): Promise<Response> {
	const useCase = container.resolve(ListUsersUseCase);
	const result = await useCase.execute();
	return resultToResponse(c, result);
}

export async function getUser(c: Context): Promise<Response> {
	const id = c.req.param('id');
	const useCase = container.resolve(GetUserUseCase);
	const result = await useCase.execute(id);
	return resultToResponse(c, result);
}

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

export async function anonymizeMe(c: Context): Promise<Response> {
	const userId = c.get('userId');
	const useCase = container.resolve(AnonymizeUserUseCase);
	const result = await useCase.execute(userId);
	if (!result.success) {
		return resultToResponse(c, result);
	}
	return c.body(null, 204);
}

export async function anonymizeUser(c: Context): Promise<Response> {
	const id = c.req.param('id');
	const useCase = container.resolve(AnonymizeUserUseCase);
	const result = await useCase.execute(id);
	if (!result.success) {
		return resultToResponse(c, result);
	}
	return c.body(null, 204);
}
