/**
 * @file Unit tests for the CreateDriverUseCase.
 *
 * Covers successful driver profile creation with role upgrade, duplicate
 * driver rejection, repository error propagation, and the behavior when
 * the role upgrade fails (driver creation should still succeed).
 */

import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import {
	createMockAuthRepository,
	createMockDriverRepository,
	createMockLogger,
	createMockUserRepository,
} from '../../../../tests/setup.js';
import { DriverAlreadyExistsError } from '../../../lib/errors/domain.errors.js';
import { DatabaseError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import type { CreateDriverSchemaType } from '../../schemas/driver.schema.js';
import type { WithAuthContext } from '../../../lib/shared/types/auth-context.js';
import { CreateDriverUseCase } from './create-driver.use-case.js';

// Test suite for creating driver profiles with role promotion
describe('CreateDriverUseCase', () => {
	let useCase: CreateDriverUseCase;
	let mockDriverRepository: ReturnType<typeof createMockDriverRepository>;
	let mockUserRepository: ReturnType<typeof createMockUserRepository>;
	let mockAuthRepository: ReturnType<typeof createMockAuthRepository>;

	const validInput: WithAuthContext<CreateDriverSchemaType> = {
		driverLicense: 'DL-123456',
		userId: 'user-id-1',
	};

	const mockUser = {
		id: 'user-id-1',
		refId: 1,
		authRefId: 10,
		firstName: 'John',
		lastName: 'Doe',
		phone: '0612345678',
		email: 'test@example.com',
		anonymizedAt: null,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockDriver = {
		id: 'driver-id-1',
		refId: 1,
		driverLicense: 'DL-123456',
		userRefId: 1,
		anonymizedAt: null,
	};

	beforeEach(() => {
		mockDriverRepository = createMockDriverRepository();
		mockUserRepository = createMockUserRepository();
		mockAuthRepository = createMockAuthRepository();

		container.registerInstance(TOKENS.DriverRepository, mockDriverRepository);
		container.registerInstance(TOKENS.UserRepository, mockUserRepository);
		container.registerInstance(TOKENS.AuthRepository, mockAuthRepository);
		container.registerInstance(TOKENS.Logger, createMockLogger());

		useCase = container.resolve(CreateDriverUseCase);
	});

	// Happy path: driver is created and role upgrade is triggered
	it('should create a driver successfully', async () => {
		mockUserRepository.findById.mockResolvedValue(ok(mockUser));
		mockDriverRepository.findByUserRefId.mockResolvedValue(ok(null));
		mockDriverRepository.create.mockResolvedValue(ok(mockDriver));
		mockAuthRepository.updateRole.mockResolvedValue(ok(undefined));

		const result = await useCase.execute(validInput);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.value).toEqual(mockDriver);
		}
		expect(mockUserRepository.findById).toHaveBeenCalledWith(validInput.userId);
		expect(mockDriverRepository.findByUserRefId).toHaveBeenCalledWith(mockUser.refId);
		expect(mockDriverRepository.create).toHaveBeenCalledWith({
			driverLicense: validInput.driverLicense,
			userRefId: mockUser.refId,
		});
	});

	// Verifies the Auth role is changed from USER to DRIVER
	it('should upgrade user role to DRIVER after successful creation', async () => {
		mockUserRepository.findById.mockResolvedValue(ok(mockUser));
		mockDriverRepository.findByUserRefId.mockResolvedValue(ok(null));
		mockDriverRepository.create.mockResolvedValue(ok(mockDriver));
		mockAuthRepository.updateRole.mockResolvedValue(ok(undefined));

		await useCase.execute(validInput);

		expect(mockAuthRepository.updateRole).toHaveBeenCalledWith(mockUser.authRefId, 'DRIVER');
	});

	// Verifies role is not upgraded when driver creation itself fails
	it('should not upgrade role when driver creation fails', async () => {
		mockUserRepository.findById.mockResolvedValue(ok(mockUser));
		mockDriverRepository.findByUserRefId.mockResolvedValue(ok(null));
		mockDriverRepository.create.mockResolvedValue(err(new DatabaseError('DB error')));

		const result = await useCase.execute(validInput);

		expect(result.success).toBe(false);
		expect(mockAuthRepository.updateRole).not.toHaveBeenCalled();
	});

	// Duplicate guard: user already has a driver profile
	it('should return DriverAlreadyExistsError when driver already exists', async () => {
		mockUserRepository.findById.mockResolvedValue(ok(mockUser));
		mockDriverRepository.findByUserRefId.mockResolvedValue(ok(mockDriver));

		const result = await useCase.execute(validInput);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toBeInstanceOf(DriverAlreadyExistsError);
		}
		expect(mockDriverRepository.create).not.toHaveBeenCalled();
		expect(mockAuthRepository.updateRole).not.toHaveBeenCalled();
	});

	// DB error during driver existence check bubbles up
	it('should return error when findByUserRefId fails', async () => {
		mockUserRepository.findById.mockResolvedValue(ok(mockUser));
		mockDriverRepository.findByUserRefId.mockResolvedValue(err(new DatabaseError('DB error')));

		const result = await useCase.execute(validInput);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toBeInstanceOf(DatabaseError);
		}
		expect(mockDriverRepository.create).not.toHaveBeenCalled();
		expect(mockAuthRepository.updateRole).not.toHaveBeenCalled();
	});

	// Role update failure is tolerated: driver creation still succeeds
	it('should still return success even if role update fails', async () => {
		mockUserRepository.findById.mockResolvedValue(ok(mockUser));
		mockDriverRepository.findByUserRefId.mockResolvedValue(ok(null));
		mockDriverRepository.create.mockResolvedValue(ok(mockDriver));
		mockAuthRepository.updateRole.mockResolvedValue(err(new DatabaseError('Role update failed')));

		const result = await useCase.execute(validInput);

		expect(result.success).toBe(true);
		expect(mockAuthRepository.updateRole).toHaveBeenCalledWith(mockUser.authRefId, 'DRIVER');
	});
});
