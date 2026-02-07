import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { ListCitiesUseCase } from '../../src/application/use-cases/city/list-cities.use-case.js';
import { CreateCityUseCase } from '../../src/application/use-cases/city/create-city.use-case.js';
import { DeleteCityUseCase } from '../../src/application/use-cases/city/delete-city.use-case.js';
import { ok, err } from '../../src/lib/shared/types/result.js';
import { CityNotFoundError } from '../../src/domain/errors/domain.errors.js';
import { authHeaders, registerMockJwtService, registerMockUseCase } from './helpers.js';

vi.mock('../../src/infrastructure/database/generated/prisma/client.js', () => ({
	PrismaClient: class { $extends() { return this; } },
}));

import { app } from '../../src/presentation/routes/index.js';

describe('City Routes', () => {
	let listMock: { execute: ReturnType<typeof vi.fn> };
	let createMock: { execute: ReturnType<typeof vi.fn> };
	let deleteMock: { execute: ReturnType<typeof vi.fn> };

	beforeEach(() => {
		container.clearInstances();
		registerMockJwtService();
		listMock = registerMockUseCase(ListCitiesUseCase);
		createMock = registerMockUseCase(CreateCityUseCase);
		deleteMock = registerMockUseCase(DeleteCityUseCase);
	});

	describe('GET /api/listePostalsCodes', () => {
		it('should return 200 with cities', async () => {
			const cities = [{ id: '1', cityName: 'Paris', zipcode: '75000' }];
			listMock.execute.mockResolvedValue(ok(cities));
			const res = await app.request('/api/listePostalsCodes', { headers: authHeaders() });
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toEqual({ success: true, data: cities });
		});

		it('should return 401 without auth token', async () => {
			const res = await app.request('/api/listePostalsCodes');
			expect(res.status).toBe(401);
		});
	});

	describe('POST /api/city', () => {
		it('should return 201 on success', async () => {
			const city = { id: '1', cityName: 'Paris', zipcode: '75000' };
			createMock.execute.mockResolvedValue(ok(city));
			const res = await app.request('/api/city', {
				method: 'POST',
				body: JSON.stringify({ ville: 'Paris', cp: '75000' }),
				headers: authHeaders(),
			});
			expect(res.status).toBe(201);
			const body = await res.json();
			expect(body).toEqual({ success: true, data: city });
		});

		it('should map ville to cityName and cp to zipcode', async () => {
			createMock.execute.mockResolvedValue(ok({ id: '1', cityName: 'Lyon', zipcode: '69000' }));
			await app.request('/api/city', {
				method: 'POST',
				body: JSON.stringify({ ville: 'Lyon', cp: '69000' }),
				headers: authHeaders(),
			});
			expect(createMock.execute).toHaveBeenCalledWith({ cityName: 'Lyon', zipcode: '69000' });
		});

		it('should reject invalid input', async () => {
			const res = await app.request('/api/city', {
				method: 'POST',
				body: JSON.stringify({}),
				headers: authHeaders(),
			});
			expect(res.ok).toBe(false);
		});
	});

	describe('DELETE /api/city/:id', () => {
		it('should return 200 on success', async () => {
			deleteMock.execute.mockResolvedValue(ok(undefined));
			const res = await app.request('/api/city/1', {
				method: 'DELETE',
				headers: authHeaders(),
			});
			expect(res.status).toBe(200);
		});

		it('should return 404 when not found', async () => {
			deleteMock.execute.mockResolvedValue(err(new CityNotFoundError('1')));
			const res = await app.request('/api/city/1', {
				method: 'DELETE',
				headers: authHeaders(),
			});
			expect(res.status).toBe(404);
		});
	});
});
