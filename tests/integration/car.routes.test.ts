import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { ListCarsUseCase } from '../../src/application/use-cases/car/list-cars.use-case.js';
import { CreateCarUseCase } from '../../src/application/use-cases/car/create-car.use-case.js';
import { UpdateCarUseCase } from '../../src/application/use-cases/car/update-car.use-case.js';
import { DeleteCarUseCase } from '../../src/application/use-cases/car/delete-car.use-case.js';
import { ok, err } from '../../src/lib/shared/types/result.js';
import { CarNotFoundError, CarAlreadyExistsError } from '../../src/lib/errors/domain.errors.js';
import { authHeaders, registerMockJwtService, registerMockUseCase } from './helpers.js';

vi.mock('../../src/infrastructure/database/generated/prisma/client.js', () => ({
	PrismaClient: class { $extends() { return this; } },
}));

import { app } from '../../src/presentation/routes/index.js';

describe('Car Routes', () => {
	let listMock: { execute: ReturnType<typeof vi.fn> };
	let createMock: { execute: ReturnType<typeof vi.fn> };
	let updateMock: { execute: ReturnType<typeof vi.fn> };
	let deleteMock: { execute: ReturnType<typeof vi.fn> };

	beforeEach(() => {
		container.clearInstances();
		registerMockJwtService();
		listMock = registerMockUseCase(ListCarsUseCase);
		createMock = registerMockUseCase(CreateCarUseCase);
		updateMock = registerMockUseCase(UpdateCarUseCase);
		deleteMock = registerMockUseCase(DeleteCarUseCase);
	});

	describe('GET /api/cars', () => {
		it('should return 200 with cars', async () => {
			const cars = [{ id: '1', immat: 'AB-123-CD' }];
			listMock.execute.mockResolvedValue(ok(cars));
			const res = await app.request('/api/cars', { headers: authHeaders() });
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toEqual({ success: true, data: cars });
		});

		it('should return 401 without auth token', async () => {
			const res = await app.request('/api/cars');
			expect(res.status).toBe(401);
		});
	});

	describe('POST /api/cars', () => {
		const validBody = { model: 'Corolla', brandId: 'b1', licensePlate: 'AB-123-CD' };

		it('should return 201 on success', async () => {
			createMock.execute.mockResolvedValue(ok({ id: '1', immat: 'AB-123-CD' }));
			const res = await app.request('/api/cars', {
				method: 'POST',
				body: JSON.stringify(validBody),
				headers: authHeaders(),
			});
			expect(res.status).toBe(201);
		});

		it('should reject invalid input', async () => {
			const res = await app.request('/api/cars', {
				method: 'POST',
				body: JSON.stringify({}),
				headers: authHeaders(),
			});
			expect(res.ok).toBe(false);
		});

		it('should return 409 when car already exists', async () => {
			createMock.execute.mockResolvedValue(err(new CarAlreadyExistsError('AB-123-CD')));
			const res = await app.request('/api/cars', {
				method: 'POST',
				body: JSON.stringify(validBody),
				headers: authHeaders(),
			});
			expect(res.status).toBe(409);
		});
	});

	describe('PUT /api/cars/:id', () => {
		const validBody = { model: 'Yaris', brandId: 'b1', licensePlate: 'XY-999-ZZ' };

		it('should return 200 on success', async () => {
			updateMock.execute.mockResolvedValue(ok({ id: '1', immat: 'XY-999-ZZ' }));
			const res = await app.request('/api/cars/1', {
				method: 'PUT',
				body: JSON.stringify(validBody),
				headers: authHeaders(),
			});
			expect(res.status).toBe(200);
		});

		it('should return 404 when not found', async () => {
			updateMock.execute.mockResolvedValue(err(new CarNotFoundError('1')));
			const res = await app.request('/api/cars/1', {
				method: 'PUT',
				body: JSON.stringify(validBody),
				headers: authHeaders(),
			});
			expect(res.status).toBe(404);
		});
	});

	describe('PATCH /api/cars/:id', () => {
		it('should return 200 on success', async () => {
			updateMock.execute.mockResolvedValue(ok({ id: '1', immat: 'AB-123-CD' }));
			const res = await app.request('/api/cars/1', {
				method: 'PATCH',
				body: JSON.stringify({ licensePlate: 'XY-999-ZZ' }),
				headers: authHeaders(),
			});
			expect(res.status).toBe(200);
		});
	});

	describe('DELETE /api/cars/:id', () => {
		it('should return 204 on success', async () => {
			deleteMock.execute.mockResolvedValue(ok(undefined));
			const res = await app.request('/api/cars/1', {
				method: 'DELETE',
				headers: authHeaders(),
			});
			expect(res.status).toBe(204);
		});

		it('should return 404 when not found', async () => {
			deleteMock.execute.mockResolvedValue(err(new CarNotFoundError('1')));
			const res = await app.request('/api/cars/1', {
				method: 'DELETE',
				headers: authHeaders(),
			});
			expect(res.status).toBe(404);
		});
	});
});
