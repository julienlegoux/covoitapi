import type { Context } from 'hono';
import type { CreateCarInput, UpdateCarInput } from '../../application/dtos/car.dto.js';
import { CreateCarUseCase } from '../../application/use-cases/car/create-car.use-case.js';
import { DeleteCarUseCase } from '../../application/use-cases/car/delete-car.use-case.js';
import { ListCarsUseCase } from '../../application/use-cases/car/list-cars.use-case.js';
import { UpdateCarUseCase } from '../../application/use-cases/car/update-car.use-case.js';
import { container } from '../../infrastructure/di/container.js';
import { resultToResponse } from '../../lib/shared/utils/result-response.util.js';
import { createCarSchema, updateCarSchema, patchCarSchema } from '../validators/car.validator.js';

export async function listCars(c: Context): Promise<Response> {
	const useCase = container.resolve(ListCarsUseCase);
	const result = await useCase.execute();
	return resultToResponse(c, result);
}

export async function createCar(c: Context): Promise<Response> {
	const body = await c.req.json();
	const validated = createCarSchema.parse(body);

	const input: CreateCarInput = {
		modele: validated.modele,
		marqueId: validated.marqueId,
		immatriculation: validated.immatriculation,
	};

	const useCase = container.resolve(CreateCarUseCase);
	const result = await useCase.execute(input);
	return resultToResponse(c, result, 201);
}

export async function updateCar(c: Context): Promise<Response> {
	const id = c.req.param('id');
	const body = await c.req.json();
	const validated = updateCarSchema.parse(body);

	const input: UpdateCarInput = {
		modele: validated.modele,
		marqueId: validated.marqueId,
		immatriculation: validated.immatriculation,
	};

	const useCase = container.resolve(UpdateCarUseCase);
	const result = await useCase.execute(id, input);
	return resultToResponse(c, result);
}

export async function patchCar(c: Context): Promise<Response> {
	const id = c.req.param('id');
	const body = await c.req.json();
	const validated = patchCarSchema.parse(body);

	const input: UpdateCarInput = {
		modele: validated.modele,
		marqueId: validated.marqueId,
		immatriculation: validated.immatriculation,
	};

	const useCase = container.resolve(UpdateCarUseCase);
	const result = await useCase.execute(id, input);
	return resultToResponse(c, result);
}

export async function deleteCar(c: Context): Promise<Response> {
	const id = c.req.param('id');
	const useCase = container.resolve(DeleteCarUseCase);
	const result = await useCase.execute(id);
	return resultToResponse(c, result);
}
