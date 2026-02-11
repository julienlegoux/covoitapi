import type { Context } from 'hono';
import { CreateBrandUseCase } from '../../application/use-cases/brand/create-brand.use-case.js';
import { DeleteBrandUseCase } from '../../application/use-cases/brand/delete-brand.use-case.js';
import { ListBrandsUseCase } from '../../application/use-cases/brand/list-brands.use-case.js';
import { container } from '../../lib/shared/di/container.js';
import { paginationSchema } from '../../lib/shared/utils/pagination.util.js';
import { resultToResponse } from '../../lib/shared/utils/result-response.util.js';
import { createBrandSchema } from '../../application/schemas/brand.schema.js';

export async function listBrands(c: Context): Promise<Response> {
	const pagination = paginationSchema.parse({
		page: c.req.query('page'),
		limit: c.req.query('limit'),
	});
	const useCase = container.resolve(ListBrandsUseCase);
	const result = await useCase.execute(pagination);
	return resultToResponse(c, result);
}

export async function createBrand(c: Context): Promise<Response> {
	const body = await c.req.json();
	const validated = createBrandSchema.parse(body);

	const useCase = container.resolve(CreateBrandUseCase);
	const result = await useCase.execute(validated);
	return resultToResponse(c, result, 201);
}

export async function deleteBrand(c: Context): Promise<Response> {
	const id = c.req.param('id');
	const useCase = container.resolve(DeleteBrandUseCase);
	const result = await useCase.execute(id);
	if (!result.success) {
		return resultToResponse(c, result);
	}
	return c.body(null, 204);
}
