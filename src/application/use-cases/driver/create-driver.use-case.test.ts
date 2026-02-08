import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import {
	createMockDriverData,
	createMockDriverRepository,
	createMockUserRepository,
} from '../../../../tests/setup.js';
import { DriverAlreadyExistsError } from '../../../domain/errors/domain.errors.js';
import { DatabaseError } from '../../../infrastructure/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import type { CreateDriverInput } from '../../dtos/driver.dto.js';
import { CreateDriverUseCase } from './create-driver.use-case.js';

describe('CreateDriverUseCase', () => {
	let useCase: CreateDriverUseCase;
	let mockDriverRepository: ReturnType<typeof createMockDriverRepository>;
	let mockUserRepository: ReturnType<typeof createMockUserRepository>;

	const validInput: CreateDriverInput = {
		driverLicense: 'DL-123456',
		userId: 'user-id-1',
	};

	const mockDriver = createMockDriverData();

	beforeEach(() => {
		mockDriverRepository = createMockDriverRepository();
		mockUserRepository = createMockUserRepository();

		container.registerInstance(TOKENS.DriverRepository, mockDriverRepository);
		container.registerInstance(TOKENS.UserRepository, mockUserRepository);

		useCase = container.resolve(CreateDriverUseCase);
	});

	it('should create a driver successfully', async () => {
		mockDriverRepository.findByUserId.mockResolvedValue(ok(null));
		mockDriverRepository.create.mockResolvedValue(ok(mockDriver));
		mockUserRepository.updateRole.mockResolvedValue(ok(undefined));

		const result = await useCase.execute(validInput);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.value).toEqual(mockDriver);
		}
		expect(mockDriverRepository.findByUserId).toHaveBeenCalledWith(validInput.userId);
		expect(mockDriverRepository.create).toHaveBeenCalledWith({
			driverLicense: validInput.driverLicense,
			userId: validInput.userId,
		});
	});

	it('should upgrade user role to DRIVER after successful creation', async () => {
		mockDriverRepository.findByUserId.mockResolvedValue(ok(null));
		mockDriverRepository.create.mockResolvedValue(ok(mockDriver));
		mockUserRepository.updateRole.mockResolvedValue(ok(undefined));

		await useCase.execute(validInput);

		expect(mockUserRepository.updateRole).toHaveBeenCalledWith(validInput.userId, 'DRIVER');
	});

	it('should not upgrade role when driver creation fails', async () => {
		mockDriverRepository.findByUserId.mockResolvedValue(ok(null));
		mockDriverRepository.create.mockResolvedValue(err(new DatabaseError('DB error')));

		const result = await useCase.execute(validInput);

		expect(result.success).toBe(false);
		expect(mockUserRepository.updateRole).not.toHaveBeenCalled();
	});

	it('should return DriverAlreadyExistsError when driver already exists', async () => {
		mockDriverRepository.findByUserId.mockResolvedValue(ok(mockDriver));

		const result = await useCase.execute(validInput);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toBeInstanceOf(DriverAlreadyExistsError);
		}
		expect(mockDriverRepository.create).not.toHaveBeenCalled();
		expect(mockUserRepository.updateRole).not.toHaveBeenCalled();
	});

	it('should return error when findByUserId fails', async () => {
		mockDriverRepository.findByUserId.mockResolvedValue(err(new DatabaseError('DB error')));

		const result = await useCase.execute(validInput);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toBeInstanceOf(DatabaseError);
		}
		expect(mockDriverRepository.create).not.toHaveBeenCalled();
		expect(mockUserRepository.updateRole).not.toHaveBeenCalled();
	});

	it('should still return success even if role update fails', async () => {
		mockDriverRepository.findByUserId.mockResolvedValue(ok(null));
		mockDriverRepository.create.mockResolvedValue(ok(mockDriver));
		mockUserRepository.updateRole.mockResolvedValue(err(new DatabaseError('Role update failed')));

		const result = await useCase.execute(validInput);

		// Driver creation still succeeds, role update failure is non-blocking
		expect(result.success).toBe(true);
		expect(mockUserRepository.updateRole).toHaveBeenCalledWith(validInput.userId, 'DRIVER');
	});
});
