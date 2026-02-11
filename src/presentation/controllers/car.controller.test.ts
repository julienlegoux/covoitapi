import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Context } from 'hono';
import { container } from 'tsyringe';
import { listCars, createCar, updateCar, patchCar, deleteCar } from './car.controller.js';
import { ListCarsUseCase } from '../../application/use-cases/car/list-cars.use-case.js';
import { CreateCarUseCase } from '../../application/use-cases/car/create-car.use-case.js';
import { UpdateCarUseCase } from '../../application/use-cases/car/update-car.use-case.js';
import { DeleteCarUseCase } from '../../application/use-cases/car/delete-car.use-case.js';
import { ok, err } from '../../lib/shared/types/result.js';
import { CarNotFoundError } from '../../lib/errors/domain.errors.js';

function createMockContext(overrides?: { jsonBody?: unknown; params?: Record<string, string>; queryParams?: Record<string, string> }) {
	const jsonMock = vi.fn((body, status) => ({ body, status }));
	const bodyMock = vi.fn((body, status) => new Response(body, { status }));
	const queryParams = overrides?.queryParams ?? {};
	return {
		req: {
			json: vi.fn().mockResolvedValue(overrides?.jsonBody ?? {}),
			param: vi.fn((name: string) => overrides?.params?.[name]),
			query: vi.fn((name: string) => queryParams[name]),
		},
		json: jsonMock,
		body: bodyMock,
		_getJsonCall: () => jsonMock.mock.calls[0],
	} as unknown as Context & { _getJsonCall: () => [unknown, number] };
}

describe('Car Controller', () => {
	describe('listCars()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };
		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(ListCarsUseCase, { useValue: mockUseCase as unknown as ListCarsUseCase });
		});

		it('should return 200 with paginated list of cars', async () => {
			const paginatedResult = {
				data: [{ id: '1', licensePlate: 'AB-123-CD', modelId: 'm1' }],
				meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
			};
			mockUseCase.execute.mockResolvedValue(ok(paginatedResult));
			const ctx = createMockContext();
			await listCars(ctx);
			const [response, status] = ctx._getJsonCall();
			expect(status).toBe(200);
			expect(response).toEqual({ success: true, data: paginatedResult });
		});
	});

	describe('createCar()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };
		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(CreateCarUseCase, { useValue: mockUseCase as unknown as CreateCarUseCase });
		});

		it('should return 201 with car on success', async () => {
			const car = { id: '1', licensePlate: 'AB-123-CD', modelId: 'm1' };
			mockUseCase.execute.mockResolvedValue(ok(car));
			const ctx = createMockContext({ jsonBody: { model: 'Corolla', brandId: 'b1', licensePlate: 'AB-123-CD' } });
			await createCar(ctx);
			const [response, status] = ctx._getJsonCall();
			expect(status).toBe(201);
			expect(response).toEqual({ success: true, data: car });
		});

		it('should pass correct input mapping', async () => {
			mockUseCase.execute.mockResolvedValue(ok({ id: '1', licensePlate: 'AB', modelId: 'm1' }));
			const ctx = createMockContext({ jsonBody: { model: 'Corolla', brandId: 'b1', licensePlate: 'AB-123-CD' } });
			await createCar(ctx);
			expect(mockUseCase.execute).toHaveBeenCalledWith({ model: 'Corolla', brandId: 'b1', licensePlate: 'AB-123-CD' });
		});

		it('should throw ZodError for invalid input', async () => {
			const ctx = createMockContext({ jsonBody: {} });
			await expect(createCar(ctx)).rejects.toThrow();
		});
	});

	describe('updateCar()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };
		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(UpdateCarUseCase, { useValue: mockUseCase as unknown as UpdateCarUseCase });
		});

		it('should return 200 with updated car', async () => {
			const car = { id: '1', licensePlate: 'XY-999-ZZ', modelId: 'm1' };
			mockUseCase.execute.mockResolvedValue(ok(car));
			const ctx = createMockContext({ jsonBody: { model: 'Yaris', brandId: 'b1', licensePlate: 'XY-999-ZZ' }, params: { id: '1' } });
			await updateCar(ctx);
			const [response, status] = ctx._getJsonCall();
			expect(status).toBe(200);
			expect(response).toEqual({ success: true, data: car });
		});

		it('should extract id from request params', async () => {
			mockUseCase.execute.mockResolvedValue(ok({ id: '1', licensePlate: 'AB', modelId: 'm1' }));
			const ctx = createMockContext({ jsonBody: { model: 'Yaris', brandId: 'b1', licensePlate: 'AB' }, params: { id: 'car-42' } });
			await updateCar(ctx);
			expect(mockUseCase.execute).toHaveBeenCalledWith('car-42', expect.any(Object));
		});
	});

	describe('patchCar()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };
		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(UpdateCarUseCase, { useValue: mockUseCase as unknown as UpdateCarUseCase });
		});

		it('should return 200 with patched car', async () => {
			const car = { id: '1', licensePlate: 'AB-123-CD', modelId: 'm1' };
			mockUseCase.execute.mockResolvedValue(ok(car));
			const ctx = createMockContext({ jsonBody: { licensePlate: 'XY-999-ZZ' }, params: { id: '1' } });
			await patchCar(ctx);
			const [response, status] = ctx._getJsonCall();
			expect(status).toBe(200);
		});
	});

	describe('deleteCar()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };
		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(DeleteCarUseCase, { useValue: mockUseCase as unknown as DeleteCarUseCase });
		});

		it('should return 204 on successful delete', async () => {
			mockUseCase.execute.mockResolvedValue(ok(undefined));
			const ctx = createMockContext({ params: { id: '1' } });
			const response = await deleteCar(ctx);
			expect(response.status).toBe(204);
		});

		it('should return error when car not found', async () => {
			mockUseCase.execute.mockResolvedValue(err(new CarNotFoundError('1')));
			const ctx = createMockContext({ params: { id: '1' } });
			await deleteCar(ctx);
			const [response] = ctx._getJsonCall();
			expect(response).toHaveProperty('success', false);
		});
	});
});
