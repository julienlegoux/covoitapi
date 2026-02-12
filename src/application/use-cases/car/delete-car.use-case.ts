/**
 * @module DeleteCarUseCase
 *
 * Deletes an existing car by its UUID. Verifies the car exists and that the
 * requesting driver owns it before attempting deletion.
 */

import { inject, injectable } from 'tsyringe';
import { CarNotFoundError, DriverNotFoundError, ForbiddenError } from '../../../lib/errors/domain.errors.js';
import type { CarRepository } from '../../../domain/repositories/car.repository.js';
import type { UserRepository } from '../../../domain/repositories/user.repository.js';
import type { DriverRepository } from '../../../domain/repositories/driver.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';

/**
 * Union of all possible error types returned by the delete car use case.
 *
 * - {@link CarNotFoundError} - No car exists with the given UUID
 * - {@link DriverNotFoundError} - The authenticated user has no driver profile
 * - {@link ForbiddenError} - The car does not belong to the requesting driver
 * - {@link RepositoryError} - Database-level failure during lookup or deletion
 */
type DeleteCarError = CarNotFoundError | DriverNotFoundError | ForbiddenError | RepositoryError;

/**
 * Deletes a car after verifying it exists and belongs to the requesting driver.
 *
 * Business flow:
 * 1. Look up the car by UUID
 * 2. Resolve the authenticated user to their driver profile
 * 3. Verify the car belongs to the requesting driver
 * 4. Delete the car record
 *
 * @dependencies CarRepository, UserRepository, DriverRepository
 */
@injectable()
export class DeleteCarUseCase {
	private readonly logger: Logger;

	constructor(
		@inject(TOKENS.CarRepository)
		private readonly carRepository: CarRepository,
		@inject(TOKENS.UserRepository)
		private readonly userRepository: UserRepository,
		@inject(TOKENS.DriverRepository)
		private readonly driverRepository: DriverRepository,
		@inject(TOKENS.Logger) logger: Logger,
	) {
		this.logger = logger.child({ useCase: 'DeleteCarUseCase' });
	}

	/**
	 * Deletes the car identified by the given UUID, after verifying ownership.
	 *
	 * @param input - Object containing the car UUID and the authenticated userId
	 * @returns A Result containing void on success, or a DeleteCarError on failure
	 */
	async execute(input: { id: string; userId: string }): Promise<Result<void, DeleteCarError>> {
		const findResult = await this.carRepository.findById(input.id);
		if (!findResult.success) {
			return findResult;
		}

		if (!findResult.value) {
			this.logger.warn('Car not found for deletion', { carId: input.id });
			return err(new CarNotFoundError(input.id));
		}

		// Ownership check: resolve user → driver, compare driverRefId
		const userResult = await this.userRepository.findById(input.userId);
		if (!userResult.success) {
			return userResult;
		}
		if (!userResult.value) {
			return err(new DriverNotFoundError(input.userId));
		}

		const driverResult = await this.driverRepository.findByUserRefId(userResult.value.refId);
		if (!driverResult.success) {
			return driverResult;
		}
		if (!driverResult.value) {
			return err(new DriverNotFoundError(input.userId));
		}

		if (findResult.value.driverRefId !== driverResult.value.refId) {
			this.logger.warn('Ownership check failed for car deletion', { carId: input.id, userId: input.userId });
			return err(new ForbiddenError('Car', input.id));
		}

		this.logger.info('Car deleted', { carId: input.id });
		return this.carRepository.delete(input.id);
	}
}
