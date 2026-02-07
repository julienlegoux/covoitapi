import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { ListRoutesUseCase } from '../../src/application/use-cases/route/list-routes.use-case.js';
import { GetRouteUseCase } from '../../src/application/use-cases/route/get-route.use-case.js';
import { FindRouteUseCase } from '../../src/application/use-cases/route/find-route.use-case.js';
import { CreateRouteUseCase } from '../../src/application/use-cases/route/create-route.use-case.js';
import { DeleteRouteUseCase } from '../../src/application/use-cases/route/delete-route.use-case.js';
import { ok, err } from '../../src/lib/shared/types/result.js';
import { RouteNotFoundError } from '../../src/domain/errors/domain.errors.js';
import { authHeaders, registerMockJwtService, registerMockUseCase } from './helpers.js';

vi.mock('../../src/infrastructure/database/generated/prisma/client.js', () => ({
	PrismaClient: class { $extends() { return this; } },
}));

import { app } from '../../src/presentation/routes/index.js';

describe('Route Routes', () => {
	let listMock: { execute: ReturnType<typeof vi.fn> };
	let getMock: { execute: ReturnType<typeof vi.fn> };
	let findMock: { execute: ReturnType<typeof vi.fn> };
	let createMock: { execute: ReturnType<typeof vi.fn> };
	let deleteMock: { execute: ReturnType<typeof vi.fn> };

	beforeEach(() => {
		container.clearInstances();
		registerMockJwtService();
		listMock = registerMockUseCase(ListRoutesUseCase);
		getMock = registerMockUseCase(GetRouteUseCase);
		findMock = registerMockUseCase(FindRouteUseCase);
		createMock = registerMockUseCase(CreateRouteUseCase);
		deleteMock = registerMockUseCase(DeleteRouteUseCase);
	});

	describe('GET /api/listRoutes', () => {
		it('should return 200 with routes', async () => {
			const routes = [{ id: 'r1', kms: 100, seats: 3 }];
			listMock.execute.mockResolvedValue(ok(routes));
			const res = await app.request('/api/listRoutes', { headers: authHeaders() });
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toEqual({ success: true, data: routes });
		});

		it('should return 401 without auth token', async () => {
			const res = await app.request('/api/listRoutes');
			expect(res.status).toBe(401);
		});
	});

	describe('GET /api/route/:id', () => {
		it('should return 200 with route', async () => {
			const route = { id: 'r1', kms: 100 };
			getMock.execute.mockResolvedValue(ok(route));
			const res = await app.request('/api/route/r1', { headers: authHeaders() });
			expect(res.status).toBe(200);
			expect(getMock.execute).toHaveBeenCalledWith('r1');
		});

		it('should return 404 when not found', async () => {
			getMock.execute.mockResolvedValue(err(new RouteNotFoundError('r1')));
			const res = await app.request('/api/route/r1', { headers: authHeaders() });
			expect(res.status).toBe(404);
		});
	});

	describe('GET /api/findRoute', () => {
		it('should pass query params to use case', async () => {
			findMock.execute.mockResolvedValue(ok([]));
			const res = await app.request('/api/findRoute?villeD=Paris&villeA=Lyon&dateT=2025-06-15', { headers: authHeaders() });
			expect(res.status).toBe(200);
			expect(findMock.execute).toHaveBeenCalledWith({ villeD: 'Paris', villeA: 'Lyon', dateT: '2025-06-15' });
		});

		it('should handle missing query params', async () => {
			findMock.execute.mockResolvedValue(ok([]));
			const res = await app.request('/api/findRoute', { headers: authHeaders() });
			expect(res.status).toBe(200);
			expect(findMock.execute).toHaveBeenCalledWith({ villeD: undefined, villeA: undefined, dateT: undefined });
		});
	});

	describe('POST /api/route', () => {
		const validBody = { kms: 150, idpers: 'u1', dateT: '2025-06-15', villeD: 'Paris', villeA: 'Lyon', seats: 3, carId: 'c1' };

		it('should return 201 on success', async () => {
			createMock.execute.mockResolvedValue(ok({ id: 'r1' }));
			const res = await app.request('/api/route', {
				method: 'POST',
				body: JSON.stringify(validBody),
				headers: authHeaders(),
			});
			expect(res.status).toBe(201);
		});

		it('should reject invalid input', async () => {
			const res = await app.request('/api/route', {
				method: 'POST',
				body: JSON.stringify({}),
				headers: authHeaders(),
			});
			expect(res.ok).toBe(false);
		});
	});

	describe('DELETE /api/route/:id', () => {
		it('should return 200 on success', async () => {
			deleteMock.execute.mockResolvedValue(ok(undefined));
			const res = await app.request('/api/route/r1', {
				method: 'DELETE',
				headers: authHeaders(),
			});
			expect(res.status).toBe(200);
		});

		it('should return 404 when not found', async () => {
			deleteMock.execute.mockResolvedValue(err(new RouteNotFoundError('r1')));
			const res = await app.request('/api/route/r1', {
				method: 'DELETE',
				headers: authHeaders(),
			});
			expect(res.status).toBe(404);
		});
	});
});
