import type { Context } from 'hono';
import { container } from '../../../lib/shared/di/container.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { resultToResponse } from '../../../lib/shared/utils/result-response.util.js';
import { paginationSchema } from '../../../lib/shared/utils/pagination.util.js';
import { ListBrandsUseCase } from '../../../application/use-cases/brand/list-brands.use-case.js';
import { CreateBrandUseCase } from '../../../application/use-cases/brand/create-brand.use-case.js';
import { DeleteBrandUseCase } from '../../../application/use-cases/brand/delete-brand.use-case.js';
import { uuidSchema } from '../../../application/schemas/common.schema.js';
import { vpCreateBrandSchema } from '../schemas.js';
import type { PrismaClient } from '../../../infrastructure/database/generated/prisma/client.js';

export async function vpListBrands(c: Context): Promise<Response> {
	const pagination = paginationSchema.parse({
		page: c.req.query('page'),
		limit: c.req.query('limit'),
	});
	const useCase = container.resolve(ListBrandsUseCase);
	const result = await useCase.execute(pagination);
	return resultToResponse(c, result);
}

export async function vpCreateBrand(c: Context): Promise<Response> {
	const body = await c.req.json();
	const validated = vpCreateBrandSchema.parse(body);
	const useCase = container.resolve(CreateBrandUseCase);
	const result = await useCase.execute(validated);
	return resultToResponse(c, result, 201);
}

export async function vpUpdateBrand(c: Context): Promise<Response> {
	const id = uuidSchema.parse(c.req.param('id'));
	const body = await c.req.json();
	const validated = vpCreateBrandSchema.parse(body);

	const prisma = container.resolve<PrismaClient>(TOKENS.PrismaClient);
	try {
		const updated = await prisma.brand.update({
			where: { id },
			data: { name: validated.name },
		});
		return c.json({ success: true, data: { id: updated.id, refId: updated.refId, name: updated.name } });
	} catch (e: unknown) {
		if (e && typeof e === 'object' && 'code' in e && (e as Record<string, unknown>).code === 'P2025') {
			return c.json(
				{ success: false, error: { code: 'BRAND_NOT_FOUND', message: `Brand not found: ${id}` } },
				404,
			);
		}
		throw e;
	}
}

export async function vpDeleteBrand(c: Context): Promise<Response> {
	const id = uuidSchema.parse(c.req.param('id'));
	const useCase = container.resolve(DeleteBrandUseCase);
	const result = await useCase.execute(id);
	if (!result.success) return resultToResponse(c, result);
	return c.body(null, 204);
}
