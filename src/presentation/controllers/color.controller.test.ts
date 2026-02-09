import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Context } from 'hono';
import { container } from 'tsyringe';
import { listColors, createColor, updateColor, deleteColor } from './color.controller.js';
import { ListColorsUseCase } from '../../application/use-cases/color/list-colors.use-case.js';
import { CreateColorUseCase } from '../../application/use-cases/color/create-color.use-case.js';
import { UpdateColorUseCase } from '../../application/use-cases/color/update-color.use-case.js';
import { DeleteColorUseCase } from '../../application/use-cases/color/delete-color.use-case.js';
import { ok, err } from '../../lib/shared/types/result.js';
import { ColorNotFoundError, ColorAlreadyExistsError } from '../../lib/errors/domain.errors.js';

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

describe('Color Controller', () => {
	describe('listColors()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };

		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(ListColorsUseCase, { useValue: mockUseCase as unknown as ListColorsUseCase });
		});

		it('should return 200 with paginated list of colors', async () => {
			const paginatedResult = {
				data: [{ id: '1', name: 'Red', hex: '#FF0000' }],
				meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
			};
			mockUseCase.execute.mockResolvedValue(ok(paginatedResult));
			const ctx = createMockContext();
			await listColors(ctx);
			const [response, status] = ctx._getJsonCall();
			expect(status).toBe(200);
			expect(response).toEqual({ success: true, data: paginatedResult });
		});

		it('should return error response when use case fails', async () => {
			mockUseCase.execute.mockResolvedValue(err(new ColorNotFoundError('1')));
			const ctx = createMockContext();
			await listColors(ctx);
			const [response] = ctx._getJsonCall();
			expect(response).toHaveProperty('success', false);
		});
	});

	describe('createColor()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };

		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(CreateColorUseCase, { useValue: mockUseCase as unknown as CreateColorUseCase });
		});

		it('should return 201 with color on success', async () => {
			const color = { id: '1', name: 'Red', hex: '#FF0000' };
			mockUseCase.execute.mockResolvedValue(ok(color));
			const ctx = createMockContext({ jsonBody: { name: 'Red', hex: '#FF0000' } });
			await createColor(ctx);
			const [response, status] = ctx._getJsonCall();
			expect(status).toBe(201);
			expect(response).toEqual({ success: true, data: color });
		});

		it('should pass validated name and hex to use case', async () => {
			mockUseCase.execute.mockResolvedValue(ok({ id: '1', name: 'Blue', hex: '#0000FF' }));
			const ctx = createMockContext({ jsonBody: { name: 'Blue', hex: '#0000FF' } });
			await createColor(ctx);
			expect(mockUseCase.execute).toHaveBeenCalledWith({ name: 'Blue', hex: '#0000FF' });
		});

		it('should throw ZodError for invalid input', async () => {
			const ctx = createMockContext({ jsonBody: {} });
			await expect(createColor(ctx)).rejects.toThrow();
		});

		it('should throw ZodError for invalid hex format', async () => {
			const ctx = createMockContext({ jsonBody: { name: 'Red', hex: 'invalid' } });
			await expect(createColor(ctx)).rejects.toThrow();
		});

		it('should return error response when color already exists', async () => {
			mockUseCase.execute.mockResolvedValue(err(new ColorAlreadyExistsError('Red')));
			const ctx = createMockContext({ jsonBody: { name: 'Red', hex: '#FF0000' } });
			await createColor(ctx);
			const [response] = ctx._getJsonCall();
			expect(response).toHaveProperty('success', false);
		});
	});

	describe('updateColor()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };

		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(UpdateColorUseCase, { useValue: mockUseCase as unknown as UpdateColorUseCase });
		});

		it('should return 200 with updated color on success', async () => {
			const color = { id: '1', name: 'Dark Red', hex: '#CC0000' };
			mockUseCase.execute.mockResolvedValue(ok(color));
			const ctx = createMockContext({ jsonBody: { name: 'Dark Red', hex: '#CC0000' }, params: { id: '1' } });
			await updateColor(ctx);
			const [response, status] = ctx._getJsonCall();
			expect(status).toBe(200);
			expect(response).toEqual({ success: true, data: color });
		});

		it('should pass id from params and validated body to use case', async () => {
			mockUseCase.execute.mockResolvedValue(ok({ id: '1', name: 'Dark Red', hex: '#CC0000' }));
			const ctx = createMockContext({ jsonBody: { name: 'Dark Red' }, params: { id: '1' } });
			await updateColor(ctx);
			expect(mockUseCase.execute).toHaveBeenCalledWith({ id: '1', name: 'Dark Red', hex: undefined });
		});

		it('should return error response when color not found', async () => {
			mockUseCase.execute.mockResolvedValue(err(new ColorNotFoundError('1')));
			const ctx = createMockContext({ jsonBody: { name: 'Dark Red' }, params: { id: '1' } });
			await updateColor(ctx);
			const [response] = ctx._getJsonCall();
			expect(response).toHaveProperty('success', false);
		});
	});

	describe('deleteColor()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };

		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(DeleteColorUseCase, { useValue: mockUseCase as unknown as DeleteColorUseCase });
		});

		it('should return 204 on successful delete', async () => {
			mockUseCase.execute.mockResolvedValue(ok(undefined));
			const ctx = createMockContext({ params: { id: '1' } });
			const response = await deleteColor(ctx);
			expect(response.status).toBe(204);
		});

		it('should return error response when color not found', async () => {
			mockUseCase.execute.mockResolvedValue(err(new ColorNotFoundError('1')));
			const ctx = createMockContext({ params: { id: '1' } });
			await deleteColor(ctx);
			const [response] = ctx._getJsonCall();
			expect(response).toHaveProperty('success', false);
		});
	});
});
