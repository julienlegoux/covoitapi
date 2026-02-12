/**
 * @module DeleteCityUseCase
 *
 * Deletes an existing city by its UUID. Verifies the city exists before
 * attempting deletion to provide a meaningful not-found error.
 */

import { inject, injectable } from 'tsyringe';
import { CityNotFoundError } from '../../../lib/errors/domain.errors.js';
import type { CityRepository } from '../../../domain/repositories/city.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';

/**
 * Union of all possible error types returned by the delete city use case.
 *
 * - {@link CityNotFoundError} - No city exists with the given UUID
 * - {@link RepositoryError} - Database-level failure during lookup or deletion
 */
type DeleteCityError = CityNotFoundError | RepositoryError;

/**
 * Deletes a city after verifying it exists.
 *
 * Business flow:
 * 1. Look up the city by UUID
 * 2. If not found, return CityNotFoundError
 * 3. Delete the city record
 *
 * @dependencies CityRepository
 */
@injectable()
export class DeleteCityUseCase {
	private readonly logger: Logger;

	constructor(
		@inject(TOKENS.CityRepository)
		private readonly cityRepository: CityRepository,
		@inject(TOKENS.Logger) logger: Logger,
	) {
		this.logger = logger.child({ useCase: 'DeleteCityUseCase' });
	}

	/**
	 * Deletes the city identified by the given UUID.
	 *
	 * @param id - The UUID of the city to delete
	 * @returns A Result containing void on success, or a DeleteCityError on failure
	 */
	async execute(id: string): Promise<Result<void, DeleteCityError>> {
		const findResult = await this.cityRepository.findById(id);
		if (!findResult.success) {
			return findResult;
		}

		if (!findResult.value) {
			this.logger.warn('City not found for deletion', { cityId: id });
			return err(new CityNotFoundError(id));
		}

		this.logger.info('City deleted', { cityId: id });
		return this.cityRepository.delete(id);
	}
}
