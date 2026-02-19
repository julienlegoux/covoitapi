import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { TOKENS } from '../../src/lib/shared/di/tokens.js';
import { CreateDriverUseCase } from '../../src/application/use-cases/driver/create-driver.use-case.js';
import { ok } from '../../src/lib/shared/types/result.js';
import { authHeaders, registerMockJwtService, registerMockUseCase } from './helpers.js';
import { createMockLogger } from '../setup.js';

vi.mock('../../src/infrastructure/database/generated/prisma/client.js', () => ({
	PrismaClient: class { $extends() { return this; } },
}));

import { app } from '../../src/presentation/routes/index.js';

describe('Driver Routes', () => {
	let createMock: { execute: ReturnType<typeof vi.fn> };

	beforeEach(() => {
		container.clearInstances();
		container.registerInstance(TOKENS.Logger, createMockLogger());
		registerMockJwtService('USER');
		createMock = registerMockUseCase(CreateDriverUseCase);
	});

	describe('POST /api/v1/drivers', () => {
		it('should return 201 on success', async () => {
			const driver = { id: 'driver-1', refId: 1, driverLicense: 'ABC123' };
			createMock.execute.mockResolvedValue(ok(driver));
			const res = await app.request('/api/v1/drivers', {
				method: 'POST',
				body: JSON.stringify({ driverLicense: 'ABC123' }),
				headers: authHeaders(),
			});
			expect(res.status).toBe(201);
			const body = await res.json();
			expect(body).toEqual({ success: true, data: driver });
		});

		it('should return 401 without auth token', async () => {
			const res = await app.request('/api/v1/drivers', {
				method: 'POST',
				body: JSON.stringify({ driverLicense: 'ABC123' }),
				headers: new Headers({ 'Content-Type': 'application/json' }),
			});
			expect(res.status).toBe(401);
		});

		it('should reject invalid input', async () => {
			const res = await app.request('/api/v1/drivers', {
				method: 'POST',
				body: JSON.stringify({}),
				headers: authHeaders(),
			});
			expect(res.ok).toBe(false);
		});

		it('should pass validated body with userId to use case', async () => {
			createMock.execute.mockResolvedValue(ok({ id: 'driver-1' }));
			await app.request('/api/v1/drivers', {
				method: 'POST',
				body: JSON.stringify({ driverLicense: 'XYZ789' }),
				headers: authHeaders(),
			});
			expect(createMock.execute).toHaveBeenCalledWith({
				driverLicense: 'XYZ789',
				userId: 'test-user-id',
			});
		});
	});
});
