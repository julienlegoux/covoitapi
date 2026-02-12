/**
 * @module DeleteCarUseCase
 *
 * Deletes an existing car by its UUID. Verifies the car exists before
 * attempting deletion to provide a meaningful not-found error.
 */

import { inject, injectable } from 'tsyringe';
import { CarNotFoundError } from '../../../lib/errors/domain.errors.js';
import type { CarRepository } from '../../../domain/repositories/car.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';

/**
 * Union of all possible error types returned by the delete car use case.
 *
 * - {@link CarNotFoundError} - No car exists with the given UUID
 * - {@link RepositoryError} - Database-level failure during lookup or deletion
 */
type DeleteCarError = CarNotFoundError | RepositoryError;

/**
 * Deletes a car after verifying it exists.
 *
 * Business flow:
 * 1. Look up the car by UUID
 * 2. If not found, return CarNotFoundError
 * 3. Delete the car record
 *
 * @dependencies CarRepository
 */
@injectable()
export class DeleteCarUseCase {
	constructor(
		@inject(TOKENS.CarRepository)
		private readonly carRepository: CarRepository,
	) {}

	/**
	 * Deletes the car identified by the given UUID.
	 *
	 * @param id - The UUID of the car to delete
	 * @returns A Result containing void on success, or a DeleteCarError on failure
	 */
	async execute(id: string): Promise<Result<void, DeleteCarError>> {
		const findResult = await this.carRepository.findById(id);
		if (!findResult.success) {
			return findResult;
		}

		if (!findResult.value) {
			return err(new CarNotFoundError(id));
		}

		return this.carRepository.delete(id);
	}
}
