import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Context } from 'hono';
import { container } from 'tsyringe';
import { updateProfile } from './user.controller.js';
import { UpdateUserUseCase } from '../../application/use-cases/user/update-user.use-case.js';
import { ok, err } from '../../lib/shared/types/result.js';
import { UserNotFoundError } from '../../lib/errors/domain.errors.js';

function createMockContext(overrides?: { jsonBody?: unknown; userId?: string }) {
	const jsonMock = vi.fn((body, status) => ({ body, status }));
	const contextValues: Record<string, unknown> = {};
	if (overrides?.userId) {
		contextValues['userId'] = overrides.userId;
	}
	return {
		req: {
			json: vi.fn().mockResolvedValue(overrides?.jsonBody ?? {}),
		},
		json: jsonMock,
		get: vi.fn((key: string) => contextValues[key]),
		_getJsonCall: () => jsonMock.mock.calls[0],
	} as unknown as Context & { _getJsonCall: () => [unknown, number] };
}

describe('User Controller', () => {
	describe('updateProfile()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };

		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(UpdateUserUseCase, { useValue: mockUseCase as unknown as UpdateUserUseCase });
		});

		it('should return 200 on success and use userId from context', async () => {
			const updatedUser = {
				id: 'user-123',
				email: 'test@example.com',
				firstName: 'John',
				lastName: 'Doe',
				phone: '0612345678',
				role: 'USER',
				anonymizedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			mockUseCase.execute.mockResolvedValue(ok(updatedUser));

			const body = { firstName: 'John', lastName: 'Doe', phone: '0612345678' };
			const ctx = createMockContext({ jsonBody: body, userId: 'user-123' });
			await updateProfile(ctx);

			const [response, status] = ctx._getJsonCall();
			expect(status).toBe(200);
			expect(response).toEqual({ success: true, data: updatedUser });
			expect(mockUseCase.execute).toHaveBeenCalledWith('user-123', {
				firstName: 'John',
				lastName: 'Doe',
				phone: '0612345678',
			});
		});

		it('should throw ZodError for invalid input', async () => {
			const ctx = createMockContext({ jsonBody: {}, userId: 'user-123' });
			await expect(updateProfile(ctx)).rejects.toThrow();
		});

		it('should throw ZodError when phone is too short', async () => {
			const body = { firstName: 'John', lastName: 'Doe', phone: '06123' };
			const ctx = createMockContext({ jsonBody: body, userId: 'user-123' });
			await expect(updateProfile(ctx)).rejects.toThrow();
		});

		it('should return error when user not found', async () => {
			mockUseCase.execute.mockResolvedValue(err(new UserNotFoundError('user-123')));

			const body = { firstName: 'John', lastName: 'Doe', phone: '0612345678' };
			const ctx = createMockContext({ jsonBody: body, userId: 'user-123' });
			await updateProfile(ctx);

			const [response] = ctx._getJsonCall();
			expect(response).toHaveProperty('success', false);
		});
	});
});
