import type { Context } from 'hono';
import type { CreatePersonInput, PatchPersonInput, UpdatePersonInput } from '../../application/dtos/person.dto.js';
import { CreatePersonUseCase } from '../../application/use-cases/person/create-person.use-case.js';
import { DeletePersonUseCase } from '../../application/use-cases/person/delete-person.use-case.js';
import { GetPersonUseCase } from '../../application/use-cases/person/get-person.use-case.js';
import { ListPersonsUseCase } from '../../application/use-cases/person/list-persons.use-case.js';
import { UpdatePersonUseCase } from '../../application/use-cases/person/update-person.use-case.js';
import { container } from '../../infrastructure/di/container.js';
import { resultToResponse } from '../../lib/shared/utils/result-response.util.js';
import { createPersonSchema, updatePersonSchema, patchPersonSchema } from '../validators/person.validator.js';

export async function listPersons(c: Context): Promise<Response> {
	const useCase = container.resolve(ListPersonsUseCase);
	const result = await useCase.execute();
	return resultToResponse(c, result);
}

export async function getPerson(c: Context): Promise<Response> {
	const id = c.req.param('id');
	const useCase = container.resolve(GetPersonUseCase);
	const result = await useCase.execute(id);
	return resultToResponse(c, result);
}

export async function createPerson(c: Context): Promise<Response> {
	const body = await c.req.json();
	const validated = createPersonSchema.parse(body);

	const input: CreatePersonInput = {
		firstName: validated.prenom,
		lastName: validated.nom,
		phone: validated.tel,
		email: validated.email,
		password: validated.password,
	};

	const useCase = container.resolve(CreatePersonUseCase);
	const result = await useCase.execute(input);
	return resultToResponse(c, result, 201);
}

export async function updatePerson(c: Context): Promise<Response> {
	const id = c.req.param('idpers');
	const body = await c.req.json();
	const validated = updatePersonSchema.parse(body);

	const input: UpdatePersonInput = {
		firstName: validated.prenom,
		lastName: validated.nom,
		phone: validated.tel,
		email: validated.email,
	};

	const useCase = container.resolve(UpdatePersonUseCase);
	const result = await useCase.execute(id, input);
	return resultToResponse(c, result);
}

export async function patchPerson(c: Context): Promise<Response> {
	const id = c.req.param('idpers');
	const body = await c.req.json();
	const validated = patchPersonSchema.parse(body);

	const input: PatchPersonInput = {
		phone: validated.tel,
		email: validated.email,
	};

	const useCase = container.resolve(UpdatePersonUseCase);
	const result = await useCase.execute(id, input);
	return resultToResponse(c, result);
}

export async function deletePerson(c: Context): Promise<Response> {
	const id = c.req.param('id');
	const useCase = container.resolve(DeletePersonUseCase);
	const result = await useCase.execute(id);
	return resultToResponse(c, result);
}
