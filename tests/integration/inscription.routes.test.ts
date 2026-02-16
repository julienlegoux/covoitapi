import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { TOKENS } from '../../src/lib/shared/di/tokens.js';
import { ListInscriptionsUseCase } from '../../src/application/use-cases/inscription/list-inscriptions.use-case.js';
import { ListUserInscriptionsUseCase } from '../../src/application/use-cases/inscription/list-user-inscriptions.use-case.js';
import { ListTripPassengersUseCase } from '../../src/application/use-cases/inscription/list-trip-passengers.use-case.js';
import { CreateInscriptionUseCase } from '../../src/application/use-cases/inscription/create-inscription.use-case.js';
import { DeleteInscriptionUseCase } from '../../src/application/use-cases/inscription/delete-inscription.use-case.js';
import { ok, err } from '../../src/lib/shared/types/result.js';
import { InscriptionNotFoundError, TripNotFoundError, AlreadyInscribedError, NoSeatsAvailableError } from '../../src/lib/errors/domain.errors.js';
import { authHeaders, registerMockJwtService, registerMockUseCase } from './helpers.js';
import { createMockLogger } from '../setup.js';

vi.mock('../../src/infrastructure/database/generated/prisma/client.js', () => ({
	PrismaClient: class { $extends() { return this; } },
}));

import { app } from '../../src/presentation/routes/index.js';

const TEST_UUID = '550e8400-e29b-41d4-a716-446655440000';
const TEST_USER_UUID = '660e8400-e29b-41d4-a716-446655440001';
const TEST_TRIP_UUID = '770e8400-e29b-41d4-a716-446655440002';

describe('Inscription Routes', () => {
	let listMock: { execute: ReturnType<typeof vi.fn> };
	let listUserMock: { execute: ReturnType<typeof vi.fn> };
	let listPassengersMock: { execute: ReturnType<typeof vi.fn> };
	let createMock: { execute: ReturnType<typeof vi.fn> };
	let deleteMock: { execute: ReturnType<typeof vi.fn> };

	beforeEach(() => {
		container.clearInstances();
		container.registerInstance(TOKENS.Logger, createMockLogger());
		registerMockJwtService();
		listMock = registerMockUseCase(ListInscriptionsUseCase);
		listUserMock = registerMockUseCase(ListUserInscriptionsUseCase);
		listPassengersMock = registerMockUseCase(ListTripPassengersUseCase);
		createMock = registerMockUseCase(CreateInscriptionUseCase);
		deleteMock = registerMockUseCase(DeleteInscriptionUseCase);
	});

	describe('GET /api/v1/inscriptions', () => {
		it('should return 200 with inscriptions', async () => {
			const inscriptions = [{ id: '1', userId: 'u1', tripId: 'r1' }];
			listMock.execute.mockResolvedValue(ok(inscriptions));
			const res = await app.request('/api/v1/inscriptions', { headers: authHeaders() });
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toEqual({ success: true, data: inscriptions });
		});

		it('should return 401 without auth token', async () => {
			const res = await app.request('/api/v1/inscriptions');
			expect(res.status).toBe(401);
		});
	});

	describe('GET /api/v1/users/:id/inscriptions', () => {
		it('should return 200 and pass id param', async () => {
			listUserMock.execute.mockResolvedValue(ok([]));
			const res = await app.request(`/api/v1/users/${TEST_USER_UUID}/inscriptions`, { headers: authHeaders() });
			expect(res.status).toBe(200);
			expect(listUserMock.execute).toHaveBeenCalledWith(TEST_USER_UUID, { page: 1, limit: 20 });
		});
	});

	describe('GET /api/v1/trips/:id/passengers', () => {
		it('should return 200 and pass id param', async () => {
			listPassengersMock.execute.mockResolvedValue(ok([]));
			const res = await app.request(`/api/v1/trips/${TEST_TRIP_UUID}/passengers`, { headers: authHeaders() });
			expect(res.status).toBe(200);
			expect(listPassengersMock.execute).toHaveBeenCalledWith(TEST_TRIP_UUID, { page: 1, limit: 20 });
		});
	});

	describe('POST /api/v1/inscriptions', () => {
		const validBody = { tripId: 'r1' };

		it('should return 201 on success', async () => {
			const inscription = { id: '1', userId: 'u1', tripId: 'r1' };
			createMock.execute.mockResolvedValue(ok(inscription));
			const res = await app.request('/api/v1/inscriptions', {
				method: 'POST',
				body: JSON.stringify(validBody),
				headers: authHeaders(),
			});
			expect(res.status).toBe(201);
			const body = await res.json();
			expect(body).toEqual({ success: true, data: inscription });
		});

		it('should reject invalid input', async () => {
			const res = await app.request('/api/v1/inscriptions', {
				method: 'POST',
				body: JSON.stringify({}),
				headers: authHeaders(),
			});
			expect(res.ok).toBe(false);
		});

		it('should return 404 when trip not found', async () => {
			createMock.execute.mockResolvedValue(err(new TripNotFoundError('r1')));
			const res = await app.request('/api/inscriptions', {
				method: 'POST',
				body: JSON.stringify(validBody),
				headers: authHeaders(),
			});
			expect(res.status).toBe(404);
		});

		it('should return 409 when already inscribed', async () => {
			createMock.execute.mockResolvedValue(err(new AlreadyInscribedError('u1', 'r1')));
			const res = await app.request('/api/v1/inscriptions', {
				method: 'POST',
				body: JSON.stringify(validBody),
				headers: authHeaders(),
			});
			expect(res.status).toBe(409);
		});

		it('should return 400 when no seats available', async () => {
			createMock.execute.mockResolvedValue(err(new NoSeatsAvailableError('r1')));
			const res = await app.request('/api/v1/inscriptions', {
				method: 'POST',
				body: JSON.stringify(validBody),
				headers: authHeaders(),
			});
			expect(res.status).toBe(400);
		});
	});

	describe('DELETE /api/v1/inscriptions/:id', () => {
		it('should return 204 on success', async () => {
			deleteMock.execute.mockResolvedValue(ok(undefined));
			const res = await app.request(`/api/v1/inscriptions/${TEST_UUID}`, {
				method: 'DELETE',
				headers: authHeaders(),
			});
			expect(res.status).toBe(204);
		});

		it('should return 404 when not found', async () => {
			deleteMock.execute.mockResolvedValue(err(new InscriptionNotFoundError(TEST_UUID)));
			const res = await app.request(`/api/v1/inscriptions/${TEST_UUID}`, {
				method: 'DELETE',
				headers: authHeaders(),
			});
			expect(res.status).toBe(404);
		});
	});
});
