/**
 * Unit tests for the DriverController (createDriver handler).
 * Covers successful creation with userId injection from auth context,
 * input validation, and Zod error on invalid input.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Context } from 'hono';
import { container } from 'tsyringe';
import { createDriver } from './driver.controller.js';
import { CreateDriverUseCase } from '../../application/use-cases/driver/create-driver.use-case.js';
import { ok } from '../../lib/shared/types/result.js';

const TEST_USER_ID = '660e8400-e29b-41d4-a716-446655440001';

function createMockContext(overrides?: { jsonBody?: unknown; userId?: string }) {
	const jsonMock = vi.fn((body, status) => ({ body, status }));
	const bodyMock = vi.fn((body, status) => new Response(body, { status }));
	const contextValues: Record<string, unknown> = {};
	if (overrides?.userId) {
		contextValues['userId'] = overrides.userId;
	}
	return {
		req: {
			json: vi.fn().mockResolvedValue(overrides?.jsonBody ?? {}),
		},
		json: jsonMock,
		body: bodyMock,
		get: vi.fn((key: string) => contextValues[key]),
		_getJsonCall: () => jsonMock.mock.calls[0],
	} as unknown as Context & { _getJsonCall: () => [unknown, number] };
}

describe('Driver Controller', () => {
	describe('createDriver()', () => {
		let mockUseCase: { execute: ReturnType<typeof vi.fn> };

		beforeEach(() => {
			container.clearInstances();
			mockUseCase = { execute: vi.fn() };
			container.register(CreateDriverUseCase, { useValue: mockUseCase as unknown as CreateDriverUseCase });
		});

		// Happy path: returns 201 on success
		it('should return 201 on success', async () => {
			const driver = { id: 'driver-1', refId: 1, driverLicense: 'ABC123' };
			mockUseCase.execute.mockResolvedValue(ok(driver));
			const ctx = createMockContext({ jsonBody: { driverLicense: 'ABC123' }, userId: TEST_USER_ID });

			await createDriver(ctx);

			const [response, status] = ctx._getJsonCall();
			expect(status).toBe(201);
			expect(response).toEqual({ success: true, data: driver });
		});

		// userId from auth context is passed to use case
		it('should pass userId from context to use case', async () => {
			mockUseCase.execute.mockResolvedValue(ok({ id: 'driver-1' }));
			const ctx = createMockContext({ jsonBody: { driverLicense: 'XYZ789' }, userId: TEST_USER_ID });

			await createDriver(ctx);

			expect(mockUseCase.execute).toHaveBeenCalledWith({
				driverLicense: 'XYZ789',
				userId: TEST_USER_ID,
			});
		});

		// Invalid input triggers ZodError
		it('should throw ZodError for invalid input', async () => {
			const ctx = createMockContext({ jsonBody: {}, userId: TEST_USER_ID });
			await expect(createDriver(ctx)).rejects.toThrow();
		});
	});
});
