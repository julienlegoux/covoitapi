import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Context } from 'hono';
import { container } from 'tsyringe';
import { listRoutes, getRoute, findRoute, createRoute, deleteRoute } from './route.controller.js';
import { ListRoutesUseCase } from '../../application/use-cases/route/list-routes.use-case.js';
import { GetRouteUseCase } from '../../application/use-cases/route/get-route.use-case.js';
import { FindRouteUseCase } from '../../application/use-cases/route/find-route.use-case.js';
import { CreateRouteUseCase } from '../../application/use-cases/route/create-route.use-case.js';
import { DeleteRouteUseCase } from '../../application/use-cases/route/delete-route.use-case.js';
import { ok, err } from '../../lib/shared/types/result.js';
import { RouteNotFoundError } from '../../lib/errors/domain.errors.js';

function createMockContext(overrides?: { jsonBody?: unknown; params?: Record<string, string>; queryParams?: Record<string, string>; userId?: string }) {
	const jsonMock = vi.fn((body, status) => ({ body, status }));
	const bodyMock = vi.fn((body, status) => new Response(body, { status }));
	const contextValues: Record<string, unknown> = {};
	if (overrides?.userId) {
		contextValues['userId'] = overrides.userId;
	}
	return {
		req: {
			json: vi.fn().mockResolvedValue(overrides?.jsonBody ?? {}),
			param: vi.fn((name: string) => overrides?.params?.[name]),
			query: vi.fn((name: string) => overrides?.queryParams?.[name]),
		},
		json: jsonMock,
		body: bodyMock,
		get: vi.fn((key: string) => contextValues[key]),
		_getJsonCall: () => jsonMock.mock.calls[0],
		_getBodyCall: () => bodyMock.mock.calls[0],
	} as unknown as Context & { _getJsonCall: () => [unknown, number]; _getBodyCall: () => [unknown, number] };
}

describe('Route Controller', () => {
	describe('listRoutes()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };
		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(ListRoutesUseCase, { useValue: mockUseCase as unknown as ListRoutesUseCase });
		});

		it('should return 200 with list of routes', async () => {
			mockUseCase.execute.mockResolvedValue(ok([]));
			const ctx = createMockContext();
			await listRoutes(ctx);
			const [response, status] = ctx._getJsonCall();
			expect(status).toBe(200);
			expect(response).toEqual({ success: true, data: [] });
		});
	});

	describe('getRoute()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };
		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(GetRouteUseCase, { useValue: mockUseCase as unknown as GetRouteUseCase });
		});

		it('should return 200 with route', async () => {
			const route = { id: 'r1', kms: 100, seats: 3 };
			mockUseCase.execute.mockResolvedValue(ok(route));
			const ctx = createMockContext({ params: { id: 'r1' } });
			await getRoute(ctx);
			const [response, status] = ctx._getJsonCall();
			expect(status).toBe(200);
			expect(mockUseCase.execute).toHaveBeenCalledWith('r1');
		});

		it('should return error when route not found', async () => {
			mockUseCase.execute.mockResolvedValue(err(new RouteNotFoundError('r1')));
			const ctx = createMockContext({ params: { id: 'r1' } });
			await getRoute(ctx);
			const [response] = ctx._getJsonCall();
			expect(response).toHaveProperty('success', false);
		});
	});

	describe('findRoute()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };
		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(FindRouteUseCase, { useValue: mockUseCase as unknown as FindRouteUseCase });
		});

		it('should return 200 with filtered routes', async () => {
			mockUseCase.execute.mockResolvedValue(ok([]));
			const ctx = createMockContext({ queryParams: { departureCity: 'Paris', arrivalCity: 'Lyon', date: '2025-06-15' } });
			await findRoute(ctx);
			expect(mockUseCase.execute).toHaveBeenCalledWith({ departureCity: 'Paris', arrivalCity: 'Lyon', date: '2025-06-15' });
			const [, status] = ctx._getJsonCall();
			expect(status).toBe(200);
		});

		it('should pass undefined for missing query params', async () => {
			mockUseCase.execute.mockResolvedValue(ok([]));
			const ctx = createMockContext({ queryParams: {} });
			await findRoute(ctx);
			expect(mockUseCase.execute).toHaveBeenCalledWith({ departureCity: undefined, arrivalCity: undefined, date: undefined });
		});
	});

	describe('createRoute()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };
		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(CreateRouteUseCase, { useValue: mockUseCase as unknown as CreateRouteUseCase });
		});

		it('should return 201 on success and use userId from context', async () => {
			mockUseCase.execute.mockResolvedValue(ok({ id: 'r1' }));
			const body = { kms: 150, date: '2025-06-15', departureCity: 'Paris', arrivalCity: 'Lyon', seats: 3, carId: 'c1' };
			const ctx = createMockContext({ jsonBody: body, userId: 'u1' });
			await createRoute(ctx);
			const [response, status] = ctx._getJsonCall();
			expect(status).toBe(201);
			expect(mockUseCase.execute).toHaveBeenCalledWith({
				kms: 150,
				userId: 'u1',
				date: '2025-06-15',
				departureCity: 'Paris',
				arrivalCity: 'Lyon',
				seats: 3,
				carId: 'c1',
			});
		});

		it('should throw ZodError for invalid input', async () => {
			const ctx = createMockContext({ jsonBody: {}, userId: 'u1' });
			await expect(createRoute(ctx)).rejects.toThrow();
		});
	});

	describe('deleteRoute()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };
		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(DeleteRouteUseCase, { useValue: mockUseCase as unknown as DeleteRouteUseCase });
		});

		it('should return 204 on successful delete', async () => {
			mockUseCase.execute.mockResolvedValue(ok(undefined));
			const ctx = createMockContext({ params: { id: 'r1' } });
			const response = await deleteRoute(ctx);
			expect(response.status).toBe(204);
		});

		it('should return error when route not found', async () => {
			mockUseCase.execute.mockResolvedValue(err(new RouteNotFoundError('r1')));
			const ctx = createMockContext({ params: { id: 'r1' } });
			await deleteRoute(ctx);
			const [response] = ctx._getJsonCall();
			expect(response).toHaveProperty('success', false);
		});
	});
});
