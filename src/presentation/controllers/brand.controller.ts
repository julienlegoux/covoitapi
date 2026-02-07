import type { Context } from 'hono';
import type { CreateBrandInput } from '../../application/dtos/brand.dto.js';
import { CreateBrandUseCase } from '../../application/use-cases/brand/create-brand.use-case.js';
import { DeleteBrandUseCase } from '../../application/use-cases/brand/delete-brand.use-case.js';
import { ListBrandsUseCase } from '../../application/use-cases/brand/list-brands.use-case.js';
import { container } from '../../infrastructure/di/container.js';
import { resultToResponse } from '../../lib/shared/utils/result-response.util.js';
import { createBrandSchema } from '../validators/brand.validator.js';

export async function listBrands(c: Context): Promise<Response> {
	const useCase = container.resolve(ListBrandsUseCase);
	const result = await useCase.execute();
	return resultToResponse(c, result);
}

export async function createBrand(c: Context): Promise<Response> {
	const body = await c.req.json();
	const validated = createBrandSchema.parse(body);

	const input: CreateBrandInput = {
		name: validated.nom,
	};

	const useCase = container.resolve(CreateBrandUseCase);
	const result = await useCase.execute(input);
	return resultToResponse(c, result, 201);
}

export async function deleteBrand(c: Context): Promise<Response> {
	const id = c.req.param('id');
	const useCase = container.resolve(DeleteBrandUseCase);
	const result = await useCase.execute(id);
	return resultToResponse(c, result);
}
