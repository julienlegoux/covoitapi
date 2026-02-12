/**
 * Unit tests for the RouteController (travel/route handlers).
 * Covers listRoutes, getRoute, findRoute (search by query params),
 * createRoute (with userId from auth context), and deleteRoute.
 * Verifies HTTP status codes, query parameter extraction, userId injection,
 * Zod validation, and TRAVEL_NOT_FOUND error propagation.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Context } from 'hono';
import { container } from 'tsyringe';
import { listRoutes, getRoute, findRoute, createRoute, deleteRoute } from './route.controller.js';
import { ListTravelsUseCase } from '../../application/use-cases/travel/list-travels.use-case.js';
import { GetTravelUseCase } from '../../application/use-cases/travel/get-travel.use-case.js';
import { FindTravelUseCase } from '../../application/use-cases/travel/find-travel.use-case.js';
import { CreateTravelUseCase } from '../../application/use-cases/travel/create-travel.use-case.js';
import { DeleteTravelUseCase } from '../../application/use-cases/travel/delete-travel.use-case.js';
import { ok, err } from '../../lib/shared/types/result.js';
import { TravelNotFoundError } from '../../lib/errors/domain.errors.js';

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
	// Listing all available travel routes
	describe('listRoutes()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };
		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(ListTravelsUseCase, { useValue: mockUseCase as unknown as ListTravelsUseCase });
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

	// Getting a single route by UUID
	describe('getRoute()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };
		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(GetTravelUseCase, { useValue: mockUseCase as unknown as GetTravelUseCase });
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
			mockUseCase.execute.mockResolvedValue(err(new TravelNotFoundError('r1')));
			const ctx = createMockContext({ params: { id: 'r1' } });
			await getRoute(ctx);
			const [response] = ctx._getJsonCall();
			expect(response).toHaveProperty('success', false);
		});
	});

	// Searching routes by departureCity, arrivalCity, and date query params
	describe('findRoute()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };
		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(FindTravelUseCase, { useValue: mockUseCase as unknown as FindTravelUseCase });
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

	// Route creation with userId injected from auth context
	describe('createRoute()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };
		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(CreateTravelUseCase, { useValue: mockUseCase as unknown as CreateTravelUseCase });
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

	// Route deletion by UUID
	describe('deleteRoute()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };
		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(DeleteTravelUseCase, { useValue: mockUseCase as unknown as DeleteTravelUseCase });
		});

		it('should return 204 on successful delete', async () => {
			mockUseCase.execute.mockResolvedValue(ok(undefined));
			const ctx = createMockContext({ params: { id: 'r1' } });
			const response = await deleteRoute(ctx);
			expect(response.status).toBe(204);
		});

		it('should return error when route not found', async () => {
			mockUseCase.execute.mockResolvedValue(err(new TravelNotFoundError('r1')));
			const ctx = createMockContext({ params: { id: 'r1' } });
			await deleteRoute(ctx);
			const [response] = ctx._getJsonCall();
			expect(response).toHaveProperty('success', false);
		});
	});
});
