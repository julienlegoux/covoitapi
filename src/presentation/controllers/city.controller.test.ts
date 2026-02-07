import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Context } from 'hono';
import { container } from 'tsyringe';
import { listCities, createCity, deleteCity } from './city.controller.js';
import { ListCitiesUseCase } from '../../application/use-cases/city/list-cities.use-case.js';
import { CreateCityUseCase } from '../../application/use-cases/city/create-city.use-case.js';
import { DeleteCityUseCase } from '../../application/use-cases/city/delete-city.use-case.js';
import { ok, err } from '../../lib/shared/types/result.js';
import { CityNotFoundError } from '../../domain/errors/domain.errors.js';

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

describe('City Controller', () => {
	describe('listCities()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };
		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(ListCitiesUseCase, { useValue: mockUseCase as unknown as ListCitiesUseCase });
		});

		it('should return 200 with list of cities', async () => {
			const cities = [{ id: '1', cityName: 'Paris', zipcode: '75000' }];
			mockUseCase.execute.mockResolvedValue(ok(cities));
			const ctx = createMockContext();
			await listCities(ctx);
			const [response, status] = ctx._getJsonCall();
			expect(status).toBe(200);
			expect(response).toEqual({ success: true, data: cities });
		});
	});

	describe('createCity()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };
		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(CreateCityUseCase, { useValue: mockUseCase as unknown as CreateCityUseCase });
		});

		it('should return 201 with city on success', async () => {
			const city = { id: '1', cityName: 'Paris', zipcode: '75000' };
			mockUseCase.execute.mockResolvedValue(ok(city));
			const ctx = createMockContext({ jsonBody: { ville: 'Paris', cp: '75000' } });
			await createCity(ctx);
			const [response, status] = ctx._getJsonCall();
			expect(status).toBe(201);
			expect(response).toEqual({ success: true, data: city });
		});

		it('should map ville to cityName and cp to zipcode', async () => {
			mockUseCase.execute.mockResolvedValue(ok({ id: '1', cityName: 'Lyon', zipcode: '69000' }));
			const ctx = createMockContext({ jsonBody: { ville: 'Lyon', cp: '69000' } });
			await createCity(ctx);
			expect(mockUseCase.execute).toHaveBeenCalledWith({ cityName: 'Lyon', zipcode: '69000' });
		});

		it('should throw ZodError for invalid input', async () => {
			const ctx = createMockContext({ jsonBody: {} });
			await expect(createCity(ctx)).rejects.toThrow();
		});
	});

	describe('deleteCity()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };
		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(DeleteCityUseCase, { useValue: mockUseCase as unknown as DeleteCityUseCase });
		});

		it('should return 200 on successful delete', async () => {
			mockUseCase.execute.mockResolvedValue(ok(undefined));
			const ctx = createMockContext({ params: { id: '1' } });
			await deleteCity(ctx);
			const [response, status] = ctx._getJsonCall();
			expect(status).toBe(200);
		});

		it('should return error when city not found', async () => {
			mockUseCase.execute.mockResolvedValue(err(new CityNotFoundError('1')));
			const ctx = createMockContext({ params: { id: '1' } });
			await deleteCity(ctx);
			const [response] = ctx._getJsonCall();
			expect(response).toHaveProperty('success', false);
		});
	});
});
