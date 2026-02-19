import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { TOKENS } from '../../src/lib/shared/di/tokens.js';
import { ListColorsUseCase } from '../../src/application/use-cases/color/list-colors.use-case.js';
import { CreateColorUseCase } from '../../src/application/use-cases/color/create-color.use-case.js';
import { UpdateColorUseCase } from '../../src/application/use-cases/color/update-color.use-case.js';
import { DeleteColorUseCase } from '../../src/application/use-cases/color/delete-color.use-case.js';
import { ok, err } from '../../src/lib/shared/types/result.js';
import { ColorNotFoundError } from '../../src/lib/errors/domain.errors.js';
import { authHeaders, registerMockJwtService, registerMockUseCase } from './helpers.js';
import { createMockLogger } from '../setup.js';

vi.mock('../../src/infrastructure/database/generated/prisma/client.js', () => ({
	PrismaClient: class { $extends() { return this; } },
}));

import { app } from '../../src/presentation/routes/index.js';

const TEST_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('Color Routes', () => {
	let listMock: { execute: ReturnType<typeof vi.fn> };
	let createMock: { execute: ReturnType<typeof vi.fn> };
	let updateMock: { execute: ReturnType<typeof vi.fn> };
	let deleteMock: { execute: ReturnType<typeof vi.fn> };

	beforeEach(() => {
		container.clearInstances();
		container.registerInstance(TOKENS.Logger, createMockLogger());
		registerMockJwtService();
		listMock = registerMockUseCase(ListColorsUseCase);
		createMock = registerMockUseCase(CreateColorUseCase);
		updateMock = registerMockUseCase(UpdateColorUseCase);
		deleteMock = registerMockUseCase(DeleteColorUseCase);
	});

	describe('GET /api/v1/colors', () => {
		it('should return 200 with colors', async () => {
			const colors = [{ id: '1', name: 'Red', hex: '#FF0000' }];
			listMock.execute.mockResolvedValue(ok(colors));
			const res = await app.request('/api/v1/colors', { headers: authHeaders() });
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toEqual({ success: true, data: colors });
		});

		it('should return 401 without auth token', async () => {
			const res = await app.request('/api/v1/colors');
			expect(res.status).toBe(401);
		});
	});

	describe('POST /api/v1/colors', () => {
		it('should return 201 on success', async () => {
			const color = { id: '1', name: 'Blue', hex: '#0000FF' };
			createMock.execute.mockResolvedValue(ok(color));
			const res = await app.request('/api/v1/colors', {
				method: 'POST',
				body: JSON.stringify({ name: 'Blue', hex: '#0000FF' }),
				headers: authHeaders(),
			});
			expect(res.status).toBe(201);
			const body = await res.json();
			expect(body).toEqual({ success: true, data: color });
		});

		it('should reject invalid input', async () => {
			const res = await app.request('/api/v1/colors', {
				method: 'POST',
				body: JSON.stringify({}),
				headers: authHeaders(),
			});
			expect(res.ok).toBe(false);
		});

		it('should pass name and hex to use case', async () => {
			createMock.execute.mockResolvedValue(ok({ id: '1', name: 'Green', hex: '#00FF00' }));
			await app.request('/api/v1/colors', {
				method: 'POST',
				body: JSON.stringify({ name: 'Green', hex: '#00FF00' }),
				headers: authHeaders(),
			});
			expect(createMock.execute).toHaveBeenCalledWith({ name: 'Green', hex: '#00FF00' });
		});
	});

	describe('PATCH /api/v1/colors/:id', () => {
		it('should return 200 on success', async () => {
			const color = { id: TEST_UUID, name: 'Updated Red', hex: '#FF1111' };
			updateMock.execute.mockResolvedValue(ok(color));
			const res = await app.request(`/api/v1/colors/${TEST_UUID}`, {
				method: 'PATCH',
				body: JSON.stringify({ name: 'Updated Red', hex: '#FF1111' }),
				headers: authHeaders(),
			});
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toEqual({ success: true, data: color });
		});
	});

	describe('DELETE /api/v1/colors/:id', () => {
		it('should return 204 on success', async () => {
			deleteMock.execute.mockResolvedValue(ok(undefined));
			const res = await app.request(`/api/v1/colors/${TEST_UUID}`, {
				method: 'DELETE',
				headers: authHeaders(),
			});
			expect(res.status).toBe(204);
		});

		it('should return 404 when not found', async () => {
			deleteMock.execute.mockResolvedValue(err(new ColorNotFoundError(TEST_UUID)));
			const res = await app.request(`/api/v1/colors/${TEST_UUID}`, {
				method: 'DELETE',
				headers: authHeaders(),
			});
			expect(res.status).toBe(404);
			const body = await res.json();
			expect(body.error.code).toBe('COLOR_NOT_FOUND');
		});
	});
});
