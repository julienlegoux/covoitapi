import type { Context } from 'hono';
import { CreateColorUseCase } from '../../application/use-cases/color/create-color.use-case.js';
import { DeleteColorUseCase } from '../../application/use-cases/color/delete-color.use-case.js';
import { ListColorsUseCase } from '../../application/use-cases/color/list-colors.use-case.js';
import { UpdateColorUseCase } from '../../application/use-cases/color/update-color.use-case.js';
import { container } from '../../lib/shared/di/container.js';
import { paginationSchema } from '../../lib/shared/utils/pagination.util.js';
import { resultToResponse } from '../../lib/shared/utils/result-response.util.js';
import { createColorSchema, updateColorSchema } from '../../application/schemas/color.schema.js';

export async function listColors(c: Context): Promise<Response> {
	const pagination = paginationSchema.parse({
		page: c.req.query('page'),
		limit: c.req.query('limit'),
	});
	const useCase = container.resolve(ListColorsUseCase);
	const result = await useCase.execute(pagination);
	return resultToResponse(c, result);
}

export async function createColor(c: Context): Promise<Response> {
	const body = await c.req.json();
	const validated = createColorSchema.parse(body);

	const useCase = container.resolve(CreateColorUseCase);
	const result = await useCase.execute(validated);
	return resultToResponse(c, result, 201);
}

export async function updateColor(c: Context): Promise<Response> {
	const id = c.req.param('id');
	const body = await c.req.json();
	const validated = updateColorSchema.parse(body);

	const useCase = container.resolve(UpdateColorUseCase);
	const result = await useCase.execute({ id, ...validated });
	return resultToResponse(c, result);
}

export async function deleteColor(c: Context): Promise<Response> {
	const id = c.req.param('id');
	const useCase = container.resolve(DeleteColorUseCase);
	const result = await useCase.execute(id);
	if (!result.success) {
		return resultToResponse(c, result);
	}
	return c.body(null, 204);
}
