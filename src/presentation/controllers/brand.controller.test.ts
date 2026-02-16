/**
 * Unit tests for the BrandController (listBrands, createBrand, deleteBrand).
 * Uses mock Hono contexts and mocked use cases resolved from tsyringe.
 * Verifies pagination, 201 creation, 204 deletion, error propagation,
 * and Zod validation behavior.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Context } from 'hono';
import { container } from 'tsyringe';
import { listBrands, createBrand, deleteBrand } from './brand.controller.js';
import { ListBrandsUseCase } from '../../application/use-cases/brand/list-brands.use-case.js';
import { CreateBrandUseCase } from '../../application/use-cases/brand/create-brand.use-case.js';
import { DeleteBrandUseCase } from '../../application/use-cases/brand/delete-brand.use-case.js';
import { ok, err } from '../../lib/shared/types/result.js';
import { BrandNotFoundError } from '../../lib/errors/domain.errors.js';

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

describe('Brand Controller', () => {
	// Paginated listing of brands
	describe('listBrands()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };

		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(ListBrandsUseCase, { useValue: mockUseCase as unknown as ListBrandsUseCase });
		});

		it('should return 200 with paginated list of brands', async () => {
			const paginatedResult = {
				data: [{ id: '1', name: 'Toyota' }],
				meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
			};
			mockUseCase.execute.mockResolvedValue(ok(paginatedResult));
			const ctx = createMockContext();
			await listBrands(ctx);
			const [response, status] = ctx._getJsonCall();
			expect(status).toBe(200);
			expect(response).toEqual({ success: true, data: paginatedResult });
		});

		it('should return error response when use case fails', async () => {
			mockUseCase.execute.mockResolvedValue(err(new BrandNotFoundError('1')));
			const ctx = createMockContext();
			await listBrands(ctx);
			const [response, status] = ctx._getJsonCall();
			expect(response).toHaveProperty('success', false);
		});
	});

	// Brand creation with Zod validation
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
			const ctx = createMockContext({ jsonBody: { name: 'Toyota' } });
			await createBrand(ctx);
			const [response, status] = ctx._getJsonCall();
			expect(status).toBe(201);
			expect(response).toEqual({ success: true, data: brand });
		});

		it('should map validated.name to input.name', async () => {
			mockUseCase.execute.mockResolvedValue(ok({ id: '1', name: 'Honda' }));
			const ctx = createMockContext({ jsonBody: { name: 'Honda' } });
			await createBrand(ctx);
			expect(mockUseCase.execute).toHaveBeenCalledWith({ name: 'Honda' });
		});

		it('should throw ZodError for invalid input', async () => {
			const ctx = createMockContext({ jsonBody: {} });
			await expect(createBrand(ctx)).rejects.toThrow();
		});
	});

	// Brand deletion by UUID
	describe('deleteBrand()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };

		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(DeleteBrandUseCase, { useValue: mockUseCase as unknown as DeleteBrandUseCase });
		});

		it('should return 204 on successful delete', async () => {
			mockUseCase.execute.mockResolvedValue(ok(undefined));
			const ctx = createMockContext({ params: { id: TEST_UUID } });
			const response = await deleteBrand(ctx);
			expect(response.status).toBe(204);
		});

		it('should return error response when brand not found', async () => {
			mockUseCase.execute.mockResolvedValue(err(new BrandNotFoundError(TEST_UUID)));
			const ctx = createMockContext({ params: { id: TEST_UUID } });
			await deleteBrand(ctx);
			const [response] = ctx._getJsonCall();
			expect(response).toHaveProperty('success', false);
		});
	});
});
