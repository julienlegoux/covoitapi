import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Context } from 'hono';
import { container } from 'tsyringe';
import { listBrands, createBrand, deleteBrand } from './brand.controller.js';
import { ListBrandsUseCase } from '../../application/use-cases/brand/list-brands.use-case.js';
import { CreateBrandUseCase } from '../../application/use-cases/brand/create-brand.use-case.js';
import { DeleteBrandUseCase } from '../../application/use-cases/brand/delete-brand.use-case.js';
import { ok, err } from '../../lib/shared/types/result.js';
import { BrandNotFoundError } from '../../domain/errors/domain.errors.js';

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

describe('Brand Controller', () => {
	describe('listBrands()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };

		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(ListBrandsUseCase, { useValue: mockUseCase as unknown as ListBrandsUseCase });
		});

		it('should return 200 with list of brands', async () => {
			const brands = [{ id: '1', name: 'Toyota' }];
			mockUseCase.execute.mockResolvedValue(ok(brands));
			const ctx = createMockContext();
			await listBrands(ctx);
			const [response, status] = ctx._getJsonCall();
			expect(status).toBe(200);
			expect(response).toEqual({ success: true, data: brands });
		});

		it('should return error response when use case fails', async () => {
			mockUseCase.execute.mockResolvedValue(err(new BrandNotFoundError('1')));
			const ctx = createMockContext();
			await listBrands(ctx);
			const [response, status] = ctx._getJsonCall();
			expect(response).toHaveProperty('success', false);
		});
	});

	describe('createBrand()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };

		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(CreateBrandUseCase, { useValue: mockUseCase as unknown as CreateBrandUseCase });
		});

		it('should return 201 with brand on success', async () => {
			const brand = { id: '1', name: 'Toyota' };
			mockUseCase.execute.mockResolvedValue(ok(brand));
			const ctx = createMockContext({ jsonBody: { nom: 'Toyota' } });
			await createBrand(ctx);
			const [response, status] = ctx._getJsonCall();
			expect(status).toBe(201);
			expect(response).toEqual({ success: true, data: brand });
		});

		it('should map validated.nom to input.name', async () => {
			mockUseCase.execute.mockResolvedValue(ok({ id: '1', name: 'Honda' }));
			const ctx = createMockContext({ jsonBody: { nom: 'Honda' } });
			await createBrand(ctx);
			expect(mockUseCase.execute).toHaveBeenCalledWith({ name: 'Honda' });
		});

		it('should throw ZodError for invalid input', async () => {
			const ctx = createMockContext({ jsonBody: {} });
			await expect(createBrand(ctx)).rejects.toThrow();
		});
	});

	describe('deleteBrand()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };

		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(DeleteBrandUseCase, { useValue: mockUseCase as unknown as DeleteBrandUseCase });
		});

		it('should return 200 on successful delete', async () => {
			mockUseCase.execute.mockResolvedValue(ok(undefined));
			const ctx = createMockContext({ params: { id: '1' } });
			await deleteBrand(ctx);
			const [response, status] = ctx._getJsonCall();
			expect(status).toBe(200);
		});

		it('should return error response when brand not found', async () => {
			mockUseCase.execute.mockResolvedValue(err(new BrandNotFoundError('1')));
			const ctx = createMockContext({ params: { id: '1' } });
			await deleteBrand(ctx);
			const [response] = ctx._getJsonCall();
			expect(response).toHaveProperty('success', false);
		});
	});
});
