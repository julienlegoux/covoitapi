import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { ListBrandsUseCase } from '../../src/application/use-cases/brand/list-brands.use-case.js';
import { CreateBrandUseCase } from '../../src/application/use-cases/brand/create-brand.use-case.js';
import { DeleteBrandUseCase } from '../../src/application/use-cases/brand/delete-brand.use-case.js';
import { ok, err } from '../../src/lib/shared/types/result.js';
import { BrandNotFoundError } from '../../src/domain/errors/domain.errors.js';
import { authHeaders, registerMockJwtService, registerMockUseCase } from './helpers.js';

vi.mock('../../src/infrastructure/database/generated/prisma/client.js', () => ({
	PrismaClient: class { $extends() { return this; } },
}));

import { app } from '../../src/presentation/routes/index.js';

describe('Brand Routes', () => {
	let listMock: { execute: ReturnType<typeof vi.fn> };
	let createMock: { execute: ReturnType<typeof vi.fn> };
	let deleteMock: { execute: ReturnType<typeof vi.fn> };

	beforeEach(() => {
		container.clearInstances();
		registerMockJwtService();
		listMock = registerMockUseCase(ListBrandsUseCase);
		createMock = registerMockUseCase(CreateBrandUseCase);
		deleteMock = registerMockUseCase(DeleteBrandUseCase);
	});

	describe('GET /api/brands', () => {
		it('should return 200 with brands', async () => {
			const brands = [{ id: '1', name: 'Toyota' }];
			listMock.execute.mockResolvedValue(ok(brands));
			const res = await app.request('/api/brands', { headers: authHeaders() });
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toEqual({ success: true, data: brands });
		});

		it('should return 401 without auth token', async () => {
			const res = await app.request('/api/brands');
			expect(res.status).toBe(401);
		});
	});

	describe('POST /api/brands', () => {
		it('should return 201 on success', async () => {
			const brand = { id: '1', name: 'Toyota' };
			createMock.execute.mockResolvedValue(ok(brand));
			const res = await app.request('/api/brands', {
				method: 'POST',
				body: JSON.stringify({ name: 'Toyota' }),
				headers: authHeaders(),
			});
			expect(res.status).toBe(201);
			const body = await res.json();
			expect(body).toEqual({ success: true, data: brand });
		});

		it('should reject invalid input', async () => {
			const res = await app.request('/api/brands', {
				method: 'POST',
				body: JSON.stringify({}),
				headers: authHeaders(),
			});
			expect(res.ok).toBe(false);
		});

		it('should pass name field', async () => {
			createMock.execute.mockResolvedValue(ok({ id: '1', name: 'Honda' }));
			await app.request('/api/brands', {
				method: 'POST',
				body: JSON.stringify({ name: 'Honda' }),
				headers: authHeaders(),
			});
			expect(createMock.execute).toHaveBeenCalledWith({ name: 'Honda' });
		});
	});

	describe('DELETE /api/brands/:id', () => {
		it('should return 204 on success', async () => {
			deleteMock.execute.mockResolvedValue(ok(undefined));
			const res = await app.request('/api/brands/b1', {
				method: 'DELETE',
				headers: authHeaders(),
			});
			expect(res.status).toBe(204);
		});

		it('should return 404 when not found', async () => {
			deleteMock.execute.mockResolvedValue(err(new BrandNotFoundError('b1')));
			const res = await app.request('/api/brands/b1', {
				method: 'DELETE',
				headers: authHeaders(),
			});
			expect(res.status).toBe(404);
			const body = await res.json();
			expect(body.error.code).toBe('BRAND_NOT_FOUND');
		});
	});
});
