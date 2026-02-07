import type { Context } from 'hono';
import type { CreateDriverInput } from '../../application/dtos/driver.dto.js';
import { CreateDriverUseCase } from '../../application/use-cases/driver/create-driver.use-case.js';
import { container } from '../../lib/shared/di/container.js';
import { resultToResponse } from '../../lib/shared/utils/result-response.util.js';
import { createDriverSchema } from '../validators/driver.validator.js';

export async function createDriver(c: Context): Promise<Response> {
	const body = await c.req.json();
	const validated = createDriverSchema.parse(body);

	const input: CreateDriverInput = {
		driverLicense: validated.permis,
		userId: validated.idpers,
	};

	const useCase = container.resolve(CreateDriverUseCase);
	const result = await useCase.execute(input);
	return resultToResponse(c, result, 201);
}
