import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { ListPersonsUseCase } from '../../src/application/use-cases/person/list-persons.use-case.js';
import { GetPersonUseCase } from '../../src/application/use-cases/person/get-person.use-case.js';
import { CreatePersonUseCase } from '../../src/application/use-cases/person/create-person.use-case.js';
import { UpdatePersonUseCase } from '../../src/application/use-cases/person/update-person.use-case.js';
import { DeletePersonUseCase } from '../../src/application/use-cases/person/delete-person.use-case.js';
import { ok, err } from '../../src/lib/shared/types/result.js';
import { UserNotFoundError } from '../../src/domain/errors/domain.errors.js';
import { authHeaders, registerMockJwtService, registerMockUseCase } from './helpers.js';

vi.mock('../../src/infrastructure/database/generated/prisma/client.js', () => ({
	PrismaClient: class { $extends() { return this; } },
}));

import { app } from '../../src/presentation/routes/index.js';

describe('Person Routes', () => {
	let listMock: { execute: ReturnType<typeof vi.fn> };
	let getMock: { execute: ReturnType<typeof vi.fn> };
	let createMock: { execute: ReturnType<typeof vi.fn> };
	let updateMock: { execute: ReturnType<typeof vi.fn> };
	let deleteMock: { execute: ReturnType<typeof vi.fn> };

	beforeEach(() => {
		container.clearInstances();
		registerMockJwtService();
		listMock = registerMockUseCase(ListPersonsUseCase);
		getMock = registerMockUseCase(GetPersonUseCase);
		createMock = registerMockUseCase(CreatePersonUseCase);
		updateMock = registerMockUseCase(UpdatePersonUseCase);
		deleteMock = registerMockUseCase(DeletePersonUseCase);
	});

	describe('GET /api/listPersons', () => {
		it('should return 200 with persons', async () => {
			const persons = [{ id: '1', firstName: 'John' }];
			listMock.execute.mockResolvedValue(ok(persons));
			const res = await app.request('/api/listPersons', { headers: authHeaders() });
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toEqual({ success: true, data: persons });
		});

		it('should return 401 without auth token', async () => {
			const res = await app.request('/api/listPersons');
			expect(res.status).toBe(401);
		});
	});

	describe('GET /api/person/:id', () => {
		it('should return 200 with person', async () => {
			const person = { id: '1', firstName: 'John', lastName: 'Doe' };
			getMock.execute.mockResolvedValue(ok(person));
			const res = await app.request('/api/person/1', { headers: authHeaders() });
			expect(res.status).toBe(200);
			expect(getMock.execute).toHaveBeenCalledWith('1');
		});

		it('should return 404 when not found', async () => {
			getMock.execute.mockResolvedValue(err(new UserNotFoundError('1')));
			const res = await app.request('/api/person/1', { headers: authHeaders() });
			expect(res.status).toBe(404);
		});
	});

	describe('POST /api/person', () => {
		const validBody = { prenom: 'John', nom: 'Doe', tel: '0612345678', email: 'j@d.com', password: 'Password1' };

		it('should return 201 on success', async () => {
			createMock.execute.mockResolvedValue(ok({ id: '1' }));
			const res = await app.request('/api/person', {
				method: 'POST',
				body: JSON.stringify(validBody),
				headers: authHeaders(),
			});
			expect(res.status).toBe(201);
		});

		it('should map French fields to English', async () => {
			createMock.execute.mockResolvedValue(ok({ id: '1' }));
			await app.request('/api/person', {
				method: 'POST',
				body: JSON.stringify(validBody),
				headers: authHeaders(),
			});
			expect(createMock.execute).toHaveBeenCalledWith({
				firstName: 'John', lastName: 'Doe', phone: '0612345678', email: 'j@d.com', password: 'Password1',
			});
		});

		it('should reject invalid input', async () => {
			const res = await app.request('/api/person', {
				method: 'POST',
				body: JSON.stringify({}),
				headers: authHeaders(),
			});
			expect(res.ok).toBe(false);
		});
	});

	describe('PUT /api/person/:idpers', () => {
		const validBody = { prenom: 'John', nom: 'Doe', tel: '0612345678', email: 'j@d.com' };

		it('should return 200 on success', async () => {
			updateMock.execute.mockResolvedValue(ok({ id: 'u1' }));
			const res = await app.request('/api/person/u1', {
				method: 'PUT',
				body: JSON.stringify(validBody),
				headers: authHeaders(),
			});
			expect(res.status).toBe(200);
			expect(updateMock.execute).toHaveBeenCalledWith('u1', {
				firstName: 'John', lastName: 'Doe', phone: '0612345678', email: 'j@d.com',
			});
		});
	});

	describe('PATCH /api/person/:idpers', () => {
		it('should return 200 and map partial fields', async () => {
			updateMock.execute.mockResolvedValue(ok({ id: 'u1' }));
			const res = await app.request('/api/person/u1', {
				method: 'PATCH',
				body: JSON.stringify({ tel: '0712345678', email: 'new@test.com' }),
				headers: authHeaders(),
			});
			expect(res.status).toBe(200);
			expect(updateMock.execute).toHaveBeenCalledWith('u1', { phone: '0712345678', email: 'new@test.com' });
		});
	});

	describe('DELETE /api/person/:id', () => {
		it('should return 200 on success', async () => {
			deleteMock.execute.mockResolvedValue(ok(undefined));
			const res = await app.request('/api/person/1', {
				method: 'DELETE',
				headers: authHeaders(),
			});
			expect(res.status).toBe(200);
		});

		it('should return 404 when not found', async () => {
			deleteMock.execute.mockResolvedValue(err(new UserNotFoundError('1')));
			const res = await app.request('/api/person/1', {
				method: 'DELETE',
				headers: authHeaders(),
			});
			expect(res.status).toBe(404);
		});
	});
});
