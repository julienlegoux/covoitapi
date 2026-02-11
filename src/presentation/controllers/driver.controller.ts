import type { Context } from 'hono';
import { createDriverSchema, type CreateDriverSchemaType } from '../../application/schemas/driver.schema.js';
import { CreateDriverUseCase } from '../../application/use-cases/driver/create-driver.use-case.js';
import { container } from '../../lib/shared/di/container.js';
import { resultToResponse } from '../../lib/shared/utils/result-response.util.js';
import type { WithAuthContext } from '../../lib/shared/types/auth-context.js';

export async function createDriver(c: Context): Promise<Response> {
	const body = await c.req.json();
	const validated = createDriverSchema.parse(body);

	const input: WithAuthContext<CreateDriverSchemaType> = {
		...validated,
		userId: c.get('userId'),
	};

	const useCase = container.resolve(CreateDriverUseCase);
	const result = await useCase.execute(input);
	return resultToResponse(c, result, 201);
}
