import type { Context } from 'hono';
import type { CreateCityInput } from '../../application/dtos/city.dto.js';
import { CreateCityUseCase } from '../../application/use-cases/city/create-city.use-case.js';
import { DeleteCityUseCase } from '../../application/use-cases/city/delete-city.use-case.js';
import { ListCitiesUseCase } from '../../application/use-cases/city/list-cities.use-case.js';
import { container } from '../../infrastructure/di/container.js';
import { resultToResponse } from '../../lib/shared/utils/result-response.util.js';
import { createCitySchema } from '../validators/city.validator.js';

export async function listCities(c: Context): Promise<Response> {
	const useCase = container.resolve(ListCitiesUseCase);
	const result = await useCase.execute();
	return resultToResponse(c, result);
}

export async function createCity(c: Context): Promise<Response> {
	const body = await c.req.json();
	const validated = createCitySchema.parse(body);

	const input: CreateCityInput = {
		cityName: validated.ville,
		zipcode: validated.cp,
	};

	const useCase = container.resolve(CreateCityUseCase);
	const result = await useCase.execute(input);
	return resultToResponse(c, result, 201);
}

export async function deleteCity(c: Context): Promise<Response> {
	const id = c.req.param('id');
	const useCase = container.resolve(DeleteCityUseCase);
	const result = await useCase.execute(id);
	return resultToResponse(c, result);
}
