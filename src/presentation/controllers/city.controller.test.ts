/**
 * Unit tests for the CityController (listCities, createCity, deleteCity).
 * Verifies paginated listing, creation (201) with cityName/zipcode mapping,
 * deletion (204), error propagation, and Zod validation.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Context } from 'hono';
import { container } from 'tsyringe';
import { listCities, createCity, deleteCity } from './city.controller.js';
import { ListCitiesUseCase } from '../../application/use-cases/city/list-cities.use-case.js';
import { CreateCityUseCase } from '../../application/use-cases/city/create-city.use-case.js';
import { DeleteCityUseCase } from '../../application/use-cases/city/delete-city.use-case.js';
import { ok, err } from '../../lib/shared/types/result.js';
import { CityNotFoundError } from '../../lib/errors/domain.errors.js';

const TEST_UUID = '550e8400-e29b-41d4-a716-446655440000';

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

describe('City Controller', () => {
	// Paginated listing of cities
	describe('listCities()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };
		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(ListCitiesUseCase, { useValue: mockUseCase as unknown as ListCitiesUseCase });
		});

		it('should return 200 with paginated list of cities', async () => {
			const paginatedResult = {
				data: [{ id: '1', cityName: 'Paris', zipcode: '75000' }],
				meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
			};
			mockUseCase.execute.mockResolvedValue(ok(paginatedResult));
			const ctx = createMockContext();
			await listCities(ctx);
			const [response, status] = ctx._getJsonCall();
			expect(status).toBe(200);
			expect(response).toEqual({ success: true, data: paginatedResult });
		});
	});

	// City creation with Zod validation
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
			const ctx = createMockContext({ jsonBody: { cityName: 'Paris', zipcode: '75000' } });
			await createCity(ctx);
			const [response, status] = ctx._getJsonCall();
			expect(status).toBe(201);
			expect(response).toEqual({ success: true, data: city });
		});

		it('should map cityName and zipcode correctly', async () => {
			mockUseCase.execute.mockResolvedValue(ok({ id: '1', cityName: 'Lyon', zipcode: '69000' }));
			const ctx = createMockContext({ jsonBody: { cityName: 'Lyon', zipcode: '69000' } });
			await createCity(ctx);
			expect(mockUseCase.execute).toHaveBeenCalledWith({ cityName: 'Lyon', zipcode: '69000' });
		});

		it('should throw ZodError for invalid input', async () => {
			const ctx = createMockContext({ jsonBody: {} });
			await expect(createCity(ctx)).rejects.toThrow();
		});
	});

	// City deletion by UUID
	describe('deleteCity()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };
		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(DeleteCityUseCase, { useValue: mockUseCase as unknown as DeleteCityUseCase });
		});

		it('should return 204 on successful delete', async () => {
			mockUseCase.execute.mockResolvedValue(ok(undefined));
			const ctx = createMockContext({ params: { id: TEST_UUID } });
			const response = await deleteCity(ctx);
			expect(response.status).toBe(204);
		});

		it('should return error when city not found', async () => {
			mockUseCase.execute.mockResolvedValue(err(new CityNotFoundError(TEST_UUID)));
			const ctx = createMockContext({ params: { id: TEST_UUID } });
			await deleteCity(ctx);
			const [response] = ctx._getJsonCall();
			expect(response).toHaveProperty('success', false);
		});
	});
});
