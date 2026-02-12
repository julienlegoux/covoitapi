/**
 * Unit tests for the InscriptionController.
 * Covers all five handlers: listInscriptions, listUserInscriptions,
 * listRoutePassengers, createInscription, and deleteInscription.
 * Verifies pagination, userId injection from context, Zod validation,
 * and error propagation (TRAVEL_NOT_FOUND, INSCRIPTION_NOT_FOUND).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Context } from 'hono';
import { container } from 'tsyringe';
import { listInscriptions, listUserInscriptions, listRoutePassengers, createInscription, deleteInscription } from './inscription.controller.js';
import { ListInscriptionsUseCase } from '../../application/use-cases/inscription/list-inscriptions.use-case.js';
import { ListUserInscriptionsUseCase } from '../../application/use-cases/inscription/list-user-inscriptions.use-case.js';
import { ListRoutePassengersUseCase } from '../../application/use-cases/inscription/list-route-passengers.use-case.js';
import { CreateInscriptionUseCase } from '../../application/use-cases/inscription/create-inscription.use-case.js';
import { DeleteInscriptionUseCase } from '../../application/use-cases/inscription/delete-inscription.use-case.js';
import { ok, err } from '../../lib/shared/types/result.js';
import { InscriptionNotFoundError, TravelNotFoundError } from '../../lib/errors/domain.errors.js';

const TEST_UUID = '550e8400-e29b-41d4-a716-446655440000';
const TEST_USER_ID = '660e8400-e29b-41d4-a716-446655440001';

function createMockContext(overrides?: { jsonBody?: unknown; params?: Record<string, string>; queryParams?: Record<string, string>; userId?: string; role?: string }) {
	const jsonMock = vi.fn((body, status) => ({ body, status }));
	const bodyMock = vi.fn((body, status) => new Response(body, { status }));
	const queryParams = overrides?.queryParams ?? {};
	const contextValues: Record<string, unknown> = {};
	if (overrides?.userId) {
		contextValues['userId'] = overrides.userId;
	}
	if (overrides?.role) {
		contextValues['role'] = overrides.role;
	}
	return {
		req: {
			json: vi.fn().mockResolvedValue(overrides?.jsonBody ?? {}),
			param: vi.fn((name: string) => overrides?.params?.[name]),
			query: vi.fn((name: string) => queryParams[name]),
		},
		json: jsonMock,
		body: bodyMock,
		get: vi.fn((key: string) => contextValues[key]),
		_getJsonCall: () => jsonMock.mock.calls[0],
	} as unknown as Context & { _getJsonCall: () => [unknown, number] };
}

describe('Inscription Controller', () => {
	// Paginated listing of all inscriptions
	describe('listInscriptions()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };
		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(ListInscriptionsUseCase, { useValue: mockUseCase as unknown as ListInscriptionsUseCase });
		});

		it('should return 200 with paginated list', async () => {
			const paginatedResult = {
				data: [{ id: '1', createdAt: new Date(), userId: 'u1', routeId: 'r1' }],
				meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
			};
			mockUseCase.execute.mockResolvedValue(ok(paginatedResult));
			const ctx = createMockContext();
			await listInscriptions(ctx);
			const [response, status] = ctx._getJsonCall();
			expect(status).toBe(200);
			expect(response).toEqual({ success: true, data: paginatedResult });
		});
	});

	// Inscriptions for a specific user (nested resource: /users/:id/inscriptions)
	describe('listUserInscriptions()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };
		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(ListUserInscriptionsUseCase, { useValue: mockUseCase as unknown as ListUserInscriptionsUseCase });
		});

		it('should return 200 and extract id from params with pagination', async () => {
			const paginatedResult = { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };
			mockUseCase.execute.mockResolvedValue(ok(paginatedResult));
			const ctx = createMockContext({ params: { id: TEST_USER_ID }, userId: TEST_USER_ID, role: 'USER' });
			await listUserInscriptions(ctx);
			expect(mockUseCase.execute).toHaveBeenCalledWith(TEST_USER_ID, { page: 1, limit: 20 });
			const [, status] = ctx._getJsonCall();
			expect(status).toBe(200);
		});
	});

	// Passengers for a specific route (nested resource: /travels/:id/passengers)
	describe('listRoutePassengers()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };
		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(ListRoutePassengersUseCase, { useValue: mockUseCase as unknown as ListRoutePassengersUseCase });
		});

		it('should return 200 and extract id from params with pagination', async () => {
			const paginatedResult = { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };
			mockUseCase.execute.mockResolvedValue(ok(paginatedResult));
			const ctx = createMockContext({ params: { id: TEST_UUID } });
			await listRoutePassengers(ctx);
			expect(mockUseCase.execute).toHaveBeenCalledWith(TEST_UUID, { page: 1, limit: 20 });
			const [, status] = ctx._getJsonCall();
			expect(status).toBe(200);
		});
	});

	// Inscription creation with userId injected from auth context
	describe('createInscription()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };
		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(CreateInscriptionUseCase, { useValue: mockUseCase as unknown as CreateInscriptionUseCase });
		});

		it('should return 201 on success and use userId from context', async () => {
			const inscription = { id: '1', createdAt: new Date(), userId: 'u1', routeId: 'r1' };
			mockUseCase.execute.mockResolvedValue(ok(inscription));
			const ctx = createMockContext({ jsonBody: { travelId: 'r1' }, userId: TEST_USER_ID });
			await createInscription(ctx);
			const [response, status] = ctx._getJsonCall();
			expect(status).toBe(201);
			expect(mockUseCase.execute).toHaveBeenCalledWith({ userId: TEST_USER_ID, travelId: 'r1' });
		});

		it('should throw ZodError for invalid input', async () => {
			const ctx = createMockContext({ jsonBody: {}, userId: TEST_USER_ID });
			await expect(createInscription(ctx)).rejects.toThrow();
		});

		it('should return error when route not found', async () => {
			mockUseCase.execute.mockResolvedValue(err(new TravelNotFoundError('r1')));
			const ctx = createMockContext({ jsonBody: { travelId: 'r1' }, userId: TEST_USER_ID });
			await createInscription(ctx);
			const [response] = ctx._getJsonCall();
			expect(response).toHaveProperty('success', false);
		});
	});

	// Inscription deletion by UUID
	describe('deleteInscription()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };
		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(DeleteInscriptionUseCase, { useValue: mockUseCase as unknown as DeleteInscriptionUseCase });
		});

		it('should return 204 on successful delete', async () => {
			mockUseCase.execute.mockResolvedValue(ok(undefined));
			const ctx = createMockContext({ params: { id: TEST_UUID }, userId: TEST_USER_ID });
			const response = await deleteInscription(ctx);
			expect(response.status).toBe(204);
		});

		it('should return error when not found', async () => {
			mockUseCase.execute.mockResolvedValue(err(new InscriptionNotFoundError(TEST_UUID)));
			const ctx = createMockContext({ params: { id: TEST_UUID }, userId: TEST_USER_ID });
			await deleteInscription(ctx);
			const [response] = ctx._getJsonCall();
			expect(response).toHaveProperty('success', false);
		});
	});
});
