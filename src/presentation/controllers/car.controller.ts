import type { Context } from 'hono';
import { CreateCarUseCase } from '../../application/use-cases/car/create-car.use-case.js';
import { DeleteCarUseCase } from '../../application/use-cases/car/delete-car.use-case.js';
import { ListCarsUseCase } from '../../application/use-cases/car/list-cars.use-case.js';
import { UpdateCarUseCase } from '../../application/use-cases/car/update-car.use-case.js';
import { container } from '../../lib/shared/di/container.js';
import { paginationSchema } from '../../lib/shared/utils/pagination.util.js';
import { resultToResponse } from '../../lib/shared/utils/result-response.util.js';
import { createCarSchema, updateCarSchema, patchCarSchema } from '../../application/schemas/car.schema.js';

export async function listCars(c: Context): Promise<Response> {
	const pagination = paginationSchema.parse({
		page: c.req.query('page'),
		limit: c.req.query('limit'),
	});
	const useCase = container.resolve(ListCarsUseCase);
	const result = await useCase.execute(pagination);
	return resultToResponse(c, result);
}

export async function createCar(c: Context): Promise<Response> {
	const body = await c.req.json();
	const validated = createCarSchema.parse(body);
	const useCase = container.resolve(CreateCarUseCase);
	const result = await useCase.execute(validated);
	return resultToResponse(c, result, 201);
}

export async function updateCar(c: Context): Promise<Response> {
	const id = c.req.param('id');
	const body = await c.req.json();
	const validated = updateCarSchema.parse(body);
	const useCase = container.resolve(UpdateCarUseCase);
	const result = await useCase.execute(id, validated);
	return resultToResponse(c, result);
}

export async function patchCar(c: Context): Promise<Response> {
	const id = c.req.param('id');
	const body = await c.req.json();
	const validated = patchCarSchema.parse(body);
	const useCase = container.resolve(UpdateCarUseCase);
	const result = await useCase.execute(id, validated);
	return resultToResponse(c, result);
}

export async function deleteCar(c: Context): Promise<Response> {
	const id = c.req.param('id');
	const useCase = container.resolve(DeleteCarUseCase);
	const result = await useCase.execute(id);
	if (!result.success) {
		return resultToResponse(c, result);
	}
	return c.body(null, 204);
}
