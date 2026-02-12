import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { ListTravelsUseCase } from '../../src/application/use-cases/travel/list-travels.use-case.js';
import { GetTravelUseCase } from '../../src/application/use-cases/travel/get-travel.use-case.js';
import { FindTravelUseCase } from '../../src/application/use-cases/travel/find-travel.use-case.js';
import { CreateTravelUseCase } from '../../src/application/use-cases/travel/create-travel.use-case.js';
import { DeleteTravelUseCase } from '../../src/application/use-cases/travel/delete-travel.use-case.js';
import { ok, err } from '../../src/lib/shared/types/result.js';
import { TravelNotFoundError } from '../../src/lib/errors/domain.errors.js';
import { authHeaders, registerMockJwtService, registerMockUseCase } from './helpers.js';

vi.mock('../../src/infrastructure/database/generated/prisma/client.js', () => ({
	PrismaClient: class { $extends() { return this; } },
}));

import { app } from '../../src/presentation/routes/index.js';

describe('Travel Routes', () => {
	let listMock: { execute: ReturnType<typeof vi.fn> };
	let getMock: { execute: ReturnType<typeof vi.fn> };
	let findMock: { execute: ReturnType<typeof vi.fn> };
	let createMock: { execute: ReturnType<typeof vi.fn> };
	let deleteMock: { execute: ReturnType<typeof vi.fn> };

	beforeEach(() => {
		container.clearInstances();
		registerMockJwtService();
		listMock = registerMockUseCase(ListTravelsUseCase);
		getMock = registerMockUseCase(GetTravelUseCase);
		findMock = registerMockUseCase(FindTravelUseCase);
		createMock = registerMockUseCase(CreateTravelUseCase);
		deleteMock = registerMockUseCase(DeleteTravelUseCase);
	});

	describe('GET /api/v1/travels', () => {
		it('should return 200 with routes', async () => {
			const routes = [{ id: 'r1', kms: 100, seats: 3 }];
			listMock.execute.mockResolvedValue(ok(routes));
			const res = await app.request('/api/v1/travels', { headers: authHeaders() });
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toEqual({ success: true, data: routes });
		});

		it('should return 401 without auth token', async () => {
			const res = await app.request('/api/v1/travels');
			expect(res.status).toBe(401);
		});
	});

	describe('GET /api/v1/travels/:id', () => {
		it('should return 200 with route', async () => {
			const route = { id: 'r1', kms: 100 };
			getMock.execute.mockResolvedValue(ok(route));
			const res = await app.request('/api/v1/travels/r1', { headers: authHeaders() });
			expect(res.status).toBe(200);
			expect(getMock.execute).toHaveBeenCalledWith('r1');
		});

		it('should return 404 when not found', async () => {
			getMock.execute.mockResolvedValue(err(new TravelNotFoundError('r1')));
			const res = await app.request('/api/travels/r1', { headers: authHeaders() });
			expect(res.status).toBe(404);
		});
	});

	describe('GET /api/v1/travels/search', () => {
		it('should pass query params to use case', async () => {
			findMock.execute.mockResolvedValue(ok([]));
			const res = await app.request('/api/v1/travels/search?departureCity=Paris&arrivalCity=Lyon&date=2025-06-15', { headers: authHeaders() });
			expect(res.status).toBe(200);
			expect(findMock.execute).toHaveBeenCalledWith({ departureCity: 'Paris', arrivalCity: 'Lyon', date: '2025-06-15' });
		});

		it('should handle missing query params', async () => {
			findMock.execute.mockResolvedValue(ok([]));
			const res = await app.request('/api/v1/travels/search', { headers: authHeaders() });
			expect(res.status).toBe(200);
			expect(findMock.execute).toHaveBeenCalledWith({ departureCity: undefined, arrivalCity: undefined, date: undefined });
		});
	});

	describe('POST /api/v1/travels', () => {
		const validBody = { kms: 150, date: '2025-06-15', departureCity: 'Paris', arrivalCity: 'Lyon', seats: 3, carId: 'c1' };

		it('should return 201 on success', async () => {
			createMock.execute.mockResolvedValue(ok({ id: 'r1' }));
			const res = await app.request('/api/v1/travels', {
				method: 'POST',
				body: JSON.stringify(validBody),
				headers: authHeaders(),
			});
			expect(res.status).toBe(201);
		});

		it('should reject invalid input', async () => {
			const res = await app.request('/api/v1/travels', {
				method: 'POST',
				body: JSON.stringify({}),
				headers: authHeaders(),
			});
			expect(res.ok).toBe(false);
		});
	});

	describe('DELETE /api/v1/travels/:id', () => {
		it('should return 204 on success', async () => {
			deleteMock.execute.mockResolvedValue(ok(undefined));
			const res = await app.request('/api/v1/travels/r1', {
				method: 'DELETE',
				headers: authHeaders(),
			});
			expect(res.status).toBe(204);
		});

		it('should return 404 when not found', async () => {
			deleteMock.execute.mockResolvedValue(err(new TravelNotFoundError('r1')));
			const res = await app.request('/api/travels/r1', {
				method: 'DELETE',
				headers: authHeaders(),
			});
			expect(res.status).toBe(404);
		});
	});
});
