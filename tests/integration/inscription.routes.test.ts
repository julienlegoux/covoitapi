import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { ListInscriptionsUseCase } from '../../src/application/use-cases/inscription/list-inscriptions.use-case.js';
import { ListUserInscriptionsUseCase } from '../../src/application/use-cases/inscription/list-user-inscriptions.use-case.js';
import { ListRoutePassengersUseCase } from '../../src/application/use-cases/inscription/list-route-passengers.use-case.js';
import { CreateInscriptionUseCase } from '../../src/application/use-cases/inscription/create-inscription.use-case.js';
import { DeleteInscriptionUseCase } from '../../src/application/use-cases/inscription/delete-inscription.use-case.js';
import { ok, err } from '../../src/lib/shared/types/result.js';
import { InscriptionNotFoundError, RouteNotFoundError, AlreadyInscribedError, NoSeatsAvailableError } from '../../src/domain/errors/domain.errors.js';
import { authHeaders, registerMockJwtService, registerMockUseCase } from './helpers.js';

vi.mock('../../src/infrastructure/database/generated/prisma/client.js', () => ({
	PrismaClient: class { $extends() { return this; } },
}));

import { app } from '../../src/presentation/routes/index.js';

describe('Inscription Routes', () => {
	let listMock: { execute: ReturnType<typeof vi.fn> };
	let listUserMock: { execute: ReturnType<typeof vi.fn> };
	let listPassengersMock: { execute: ReturnType<typeof vi.fn> };
	let createMock: { execute: ReturnType<typeof vi.fn> };
	let deleteMock: { execute: ReturnType<typeof vi.fn> };

	beforeEach(() => {
		container.clearInstances();
		registerMockJwtService();
		listMock = registerMockUseCase(ListInscriptionsUseCase);
		listUserMock = registerMockUseCase(ListUserInscriptionsUseCase);
		listPassengersMock = registerMockUseCase(ListRoutePassengersUseCase);
		createMock = registerMockUseCase(CreateInscriptionUseCase);
		deleteMock = registerMockUseCase(DeleteInscriptionUseCase);
	});

	describe('GET /api/inscriptions', () => {
		it('should return 200 with inscriptions', async () => {
			const inscriptions = [{ id: '1', userId: 'u1', routeId: 'r1' }];
			listMock.execute.mockResolvedValue(ok(inscriptions));
			const res = await app.request('/api/inscriptions', { headers: authHeaders() });
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toEqual({ success: true, data: inscriptions });
		});

		it('should return 401 without auth token', async () => {
			const res = await app.request('/api/inscriptions');
			expect(res.status).toBe(401);
		});
	});

	describe('GET /api/users/:id/inscriptions', () => {
		it('should return 200 and pass id param', async () => {
			listUserMock.execute.mockResolvedValue(ok([]));
			const res = await app.request('/api/users/user-1/inscriptions', { headers: authHeaders() });
			expect(res.status).toBe(200);
			expect(listUserMock.execute).toHaveBeenCalledWith('user-1', { page: 1, limit: 20 });
		});
	});

	describe('GET /api/travels/:id/passengers', () => {
		it('should return 200 and pass id param', async () => {
			listPassengersMock.execute.mockResolvedValue(ok([]));
			const res = await app.request('/api/travels/route-1/passengers', { headers: authHeaders() });
			expect(res.status).toBe(200);
			expect(listPassengersMock.execute).toHaveBeenCalledWith('route-1', { page: 1, limit: 20 });
		});
	});

	describe('POST /api/inscriptions', () => {
		const validBody = { travelId: 'r1' };

		it('should return 201 on success', async () => {
			const inscription = { id: '1', userId: 'u1', routeId: 'r1' };
			createMock.execute.mockResolvedValue(ok(inscription));
			const res = await app.request('/api/inscriptions', {
				method: 'POST',
				body: JSON.stringify(validBody),
				headers: authHeaders(),
			});
			expect(res.status).toBe(201);
		});

		it('should reject invalid input', async () => {
			const res = await app.request('/api/inscriptions', {
				method: 'POST',
				body: JSON.stringify({}),
				headers: authHeaders(),
			});
			expect(res.ok).toBe(false);
		});

		it('should return 404 when route not found', async () => {
			createMock.execute.mockResolvedValue(err(new RouteNotFoundError('r1')));
			const res = await app.request('/api/inscriptions', {
				method: 'POST',
				body: JSON.stringify(validBody),
				headers: authHeaders(),
			});
			expect(res.status).toBe(404);
		});

		it('should return 409 when already inscribed', async () => {
			createMock.execute.mockResolvedValue(err(new AlreadyInscribedError('u1', 'r1')));
			const res = await app.request('/api/inscriptions', {
				method: 'POST',
				body: JSON.stringify(validBody),
				headers: authHeaders(),
			});
			expect(res.status).toBe(409);
		});

		it('should return 400 when no seats available', async () => {
			createMock.execute.mockResolvedValue(err(new NoSeatsAvailableError('r1')));
			const res = await app.request('/api/inscriptions', {
				method: 'POST',
				body: JSON.stringify(validBody),
				headers: authHeaders(),
			});
			expect(res.status).toBe(400);
		});
	});

	describe('DELETE /api/inscriptions/:id', () => {
		it('should return 204 on success', async () => {
			deleteMock.execute.mockResolvedValue(ok(undefined));
			const res = await app.request('/api/inscriptions/1', {
				method: 'DELETE',
				headers: authHeaders(),
			});
			expect(res.status).toBe(204);
		});

		it('should return 404 when not found', async () => {
			deleteMock.execute.mockResolvedValue(err(new InscriptionNotFoundError('1')));
			const res = await app.request('/api/inscriptions/1', {
				method: 'DELETE',
				headers: authHeaders(),
			});
			expect(res.status).toBe(404);
		});
	});
});
