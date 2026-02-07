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
import { InscriptionNotFoundError, RouteNotFoundError } from '../../domain/errors/domain.errors.js';

function createMockContext(overrides?: { jsonBody?: unknown; params?: Record<string, string> }) {
	const jsonMock = vi.fn((body, status) => ({ body, status }));
	return {
		req: {
			json: vi.fn().mockResolvedValue(overrides?.jsonBody ?? {}),
			param: vi.fn((name: string) => overrides?.params?.[name]),
		},
		json: jsonMock,
		_getJsonCall: () => jsonMock.mock.calls[0],
	} as unknown as Context & { _getJsonCall: () => [unknown, number] };
}

describe('Inscription Controller', () => {
	describe('listInscriptions()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };
		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(ListInscriptionsUseCase, { useValue: mockUseCase as unknown as ListInscriptionsUseCase });
		});

		it('should return 200 with list', async () => {
			const inscriptions = [{ id: '1', createdAt: new Date(), userId: 'u1', routeId: 'r1' }];
			mockUseCase.execute.mockResolvedValue(ok(inscriptions));
			const ctx = createMockContext();
			await listInscriptions(ctx);
			const [response, status] = ctx._getJsonCall();
			expect(status).toBe(200);
			expect(response).toEqual({ success: true, data: inscriptions });
		});
	});

	describe('listUserInscriptions()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };
		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(ListUserInscriptionsUseCase, { useValue: mockUseCase as unknown as ListUserInscriptionsUseCase });
		});

		it('should return 200 and extract idpers from params', async () => {
			mockUseCase.execute.mockResolvedValue(ok([]));
			const ctx = createMockContext({ params: { idpers: 'user-1' } });
			await listUserInscriptions(ctx);
			expect(mockUseCase.execute).toHaveBeenCalledWith('user-1');
			const [, status] = ctx._getJsonCall();
			expect(status).toBe(200);
		});
	});

	describe('listRoutePassengers()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };
		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(ListRoutePassengersUseCase, { useValue: mockUseCase as unknown as ListRoutePassengersUseCase });
		});

		it('should return 200 and extract idtrajet from params', async () => {
			mockUseCase.execute.mockResolvedValue(ok([]));
			const ctx = createMockContext({ params: { idtrajet: 'route-1' } });
			await listRoutePassengers(ctx);
			expect(mockUseCase.execute).toHaveBeenCalledWith('route-1');
			const [, status] = ctx._getJsonCall();
			expect(status).toBe(200);
		});
	});

	describe('createInscription()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };
		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(CreateInscriptionUseCase, { useValue: mockUseCase as unknown as CreateInscriptionUseCase });
		});

		it('should return 201 on success', async () => {
			const inscription = { id: '1', createdAt: new Date(), userId: 'u1', routeId: 'r1' };
			mockUseCase.execute.mockResolvedValue(ok(inscription));
			const ctx = createMockContext({ jsonBody: { idpers: 'u1', idtrajet: 'r1' } });
			await createInscription(ctx);
			const [response, status] = ctx._getJsonCall();
			expect(status).toBe(201);
			expect(mockUseCase.execute).toHaveBeenCalledWith({ idpers: 'u1', idtrajet: 'r1' });
		});

		it('should throw ZodError for invalid input', async () => {
			const ctx = createMockContext({ jsonBody: {} });
			await expect(createInscription(ctx)).rejects.toThrow();
		});

		it('should return error when route not found', async () => {
			mockUseCase.execute.mockResolvedValue(err(new RouteNotFoundError('r1')));
			const ctx = createMockContext({ jsonBody: { idpers: 'u1', idtrajet: 'r1' } });
			await createInscription(ctx);
			const [response] = ctx._getJsonCall();
			expect(response).toHaveProperty('success', false);
		});
	});

	describe('deleteInscription()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };
		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(DeleteInscriptionUseCase, { useValue: mockUseCase as unknown as DeleteInscriptionUseCase });
		});

		it('should return 200 on successful delete', async () => {
			mockUseCase.execute.mockResolvedValue(ok(undefined));
			const ctx = createMockContext({ params: { id: '1' } });
			await deleteInscription(ctx);
			const [, status] = ctx._getJsonCall();
			expect(status).toBe(200);
		});

		it('should return error when not found', async () => {
			mockUseCase.execute.mockResolvedValue(err(new InscriptionNotFoundError('1')));
			const ctx = createMockContext({ params: { id: '1' } });
			await deleteInscription(ctx);
			const [response] = ctx._getJsonCall();
			expect(response).toHaveProperty('success', false);
		});
	});
});
