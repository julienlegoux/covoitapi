import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { TOKENS } from '../../src/lib/shared/di/tokens.js';
import { ListUsersUseCase } from '../../src/application/use-cases/user/list-users.use-case.js';
import { GetUserUseCase } from '../../src/application/use-cases/user/get-user.use-case.js';
import { AnonymizeUserUseCase } from '../../src/application/use-cases/user/anonymize-user.use-case.js';
import { ok, err } from '../../src/lib/shared/types/result.js';
import { UserNotFoundError } from '../../src/lib/errors/domain.errors.js';
import { authHeaders, registerMockJwtService, registerMockUseCase } from './helpers.js';
import { createMockLogger } from '../setup.js';

vi.mock('../../src/infrastructure/database/generated/prisma/client.js', () => ({
	PrismaClient: class { $extends() { return this; } },
}));

import { app } from '../../src/presentation/routes/index.js';

const TEST_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('User Routes', () => {
	let listMock: { execute: ReturnType<typeof vi.fn> };
	let getMock: { execute: ReturnType<typeof vi.fn> };
	let deleteMock: { execute: ReturnType<typeof vi.fn> };

	beforeEach(() => {
		container.clearInstances();
		container.registerInstance(TOKENS.Logger, createMockLogger());
		registerMockJwtService();
		listMock = registerMockUseCase(ListUsersUseCase);
		getMock = registerMockUseCase(GetUserUseCase);
		deleteMock = registerMockUseCase(AnonymizeUserUseCase);
	});

	describe('GET /api/v1/users', () => {
		it('should return 200 with users', async () => {
			const users = [{ id: '1', refId: 1, authRefId: 1, firstName: 'John', email: 'john@example.com' }];
			listMock.execute.mockResolvedValue(ok(users));
			const res = await app.request('/api/v1/users', { headers: authHeaders() });
			expect(res.status).toBe(200);
			const body = await res.json();
			expect(body).toEqual({ success: true, data: users });
		});

		it('should return 401 without auth token', async () => {
			const res = await app.request('/api/v1/users');
			expect(res.status).toBe(401);
		});
	});

	describe('GET /api/v1/users/:id', () => {
		it('should return 200 with user', async () => {
			const user = { id: TEST_UUID, refId: 1, authRefId: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com' };
			getMock.execute.mockResolvedValue(ok(user));
			const res = await app.request(`/api/v1/users/${TEST_UUID}`, { headers: authHeaders() });
			expect(res.status).toBe(200);
			expect(getMock.execute).toHaveBeenCalledWith(TEST_UUID);
		});

		it('should return 404 when not found', async () => {
			getMock.execute.mockResolvedValue(err(new UserNotFoundError(TEST_UUID)));
			const res = await app.request(`/api/v1/users/${TEST_UUID}`, { headers: authHeaders() });
			expect(res.status).toBe(404);
		});
	});

	describe('DELETE /api/v1/users/:id', () => {
		it('should return 204 on success', async () => {
			deleteMock.execute.mockResolvedValue(ok(undefined));
			const res = await app.request(`/api/v1/users/${TEST_UUID}`, {
				method: 'DELETE',
				headers: authHeaders(),
			});
			expect(res.status).toBe(204);
		});

		it('should return 404 when not found', async () => {
			deleteMock.execute.mockResolvedValue(err(new UserNotFoundError(TEST_UUID)));
			const res = await app.request(`/api/v1/users/${TEST_UUID}`, {
				method: 'DELETE',
				headers: authHeaders(),
			});
			expect(res.status).toBe(404);
		});
	});
});
