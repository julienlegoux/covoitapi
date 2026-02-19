import type { Context } from 'hono';
import { container } from '../../../lib/shared/di/container.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { resultToResponse } from '../../../lib/shared/utils/result-response.util.js';
import { paginationSchema } from '../../../lib/shared/utils/pagination.util.js';
import { ListCarsUseCase } from '../../../application/use-cases/car/list-cars.use-case.js';
import { CreateCarUseCase } from '../../../application/use-cases/car/create-car.use-case.js';
import { UpdateCarUseCase } from '../../../application/use-cases/car/update-car.use-case.js';
import { DeleteCarUseCase } from '../../../application/use-cases/car/delete-car.use-case.js';
import type { CarRepository } from '../../../domain/repositories/car.repository.js';
import type { BrandRepository } from '../../../domain/repositories/brand.repository.js';
import type { WithAuthContext } from '../../../lib/shared/types/auth-context.js';
import type { CreateCarSchemaType } from '../../../application/schemas/car.schema.js';
import { uuidSchema } from '../../../application/schemas/common.schema.js';
import { vpCreateCarSchema } from '../schemas.js';
import type { PrismaClient } from '../../../infrastructure/database/generated/prisma/client.js';

async function enrichCarWithModel(car: { id: string; refId: number; licensePlate: string; modelRefId: number; driverRefId: number }) {
	const prisma = container.resolve<PrismaClient>(TOKENS.PrismaClient);
	const model = await prisma.model.findUnique({
		where: { refId: car.modelRefId },
		select: { name: true },
	});
	return { ...car, model: model?.name ?? null };
}

async function resolveBrandByName(brandName: string, c: Context) {
	const brandRepo = container.resolve<BrandRepository>(TOKENS.BrandRepository);
	const brandsResult = await brandRepo.findAll();
	if (!brandsResult.success) {
		return { success: false as const, error: resultToResponse(c, brandsResult) };
	}

	const brand = brandsResult.value.data.find(
		(b) => b.name.toLowerCase() === brandName.toLowerCase(),
	);
	if (!brand) {
		return {
			success: false as const,
			error: c.json(
				{ success: false, error: { code: 'BRAND_NOT_FOUND', message: `Brand not found: ${brandName}` } },
				404,
			),
		};
	}
	return { success: true as const, brand };
}

export async function vpListCars(c: Context): Promise<Response> {
	const pagination = paginationSchema.parse({
		page: c.req.query('page'),
		limit: c.req.query('limit'),
	});
	const useCase = container.resolve(ListCarsUseCase);
	const result = await useCase.execute(pagination);
	return resultToResponse(c, result);
}

export async function vpGetCar(c: Context): Promise<Response> {
	const id = uuidSchema.parse(c.req.param('id'));
	const carRepo = container.resolve<CarRepository>(TOKENS.CarRepository);
	const result = await carRepo.findById(id);
	if (!result.success) return resultToResponse(c, result);
	if (!result.value) {
		return c.json(
			{ success: false, error: { code: 'CAR_NOT_FOUND', message: `Car not found: ${id}` } },
			404,
		);
	}
	const enriched = await enrichCarWithModel(result.value);
	return c.json({ success: true, data: enriched });
}

export async function vpCreateCar(c: Context): Promise<Response> {
	const body = await c.req.json();
	const validated = vpCreateCarSchema.parse(body);

	const resolved = await resolveBrandByName(validated.brand, c);
	if (!resolved.success) return resolved.error;

	const input: WithAuthContext<CreateCarSchemaType> = {
		model: validated.model,
		brandId: resolved.brand.id,
		licensePlate: validated.carregistration,
		userId: c.get('userId'),
	};

	const useCase = container.resolve(CreateCarUseCase);
	const result = await useCase.execute(input);
	if (!result.success) return resultToResponse(c, result);

	// Apply seats directly via Prisma (field not in use case)
	if (validated.seats !== undefined) {
		const prisma = container.resolve<PrismaClient>(TOKENS.PrismaClient);
		await prisma.car.update({
			where: { id: result.value.id },
			data: { seats: validated.seats },
		});
	}

	const enriched = await enrichCarWithModel(result.value);
	return c.json({ success: true, data: enriched }, 201);
}

export async function vpUpdateCar(c: Context): Promise<Response> {
	const id = uuidSchema.parse(c.req.param('id'));
	const body = await c.req.json();
	const validated = vpCreateCarSchema.parse(body);

	const resolved = await resolveBrandByName(validated.brand, c);
	if (!resolved.success) return resolved.error;

	const useCase = container.resolve(UpdateCarUseCase);
	const result = await useCase.execute(
		id,
		{ model: validated.model, brandId: resolved.brand.id, licensePlate: validated.carregistration },
		c.get('userId'),
	);
	if (!result.success) return resultToResponse(c, result);

	// Apply seats directly via Prisma (field not in use case)
	if (validated.seats !== undefined) {
		const prisma = container.resolve<PrismaClient>(TOKENS.PrismaClient);
		await prisma.car.update({
			where: { id },
			data: { seats: validated.seats },
		});
	}

	const enriched = await enrichCarWithModel(result.value);
	return c.json({ success: true, data: enriched });
}

export async function vpDeleteCar(c: Context): Promise<Response> {
	const id = uuidSchema.parse(c.req.param('id'));
	const useCase = container.resolve(DeleteCarUseCase);
	const result = await useCase.execute({ id, userId: c.get('userId') });
	if (!result.success) return resultToResponse(c, result);
	return c.body(null, 204);
}
