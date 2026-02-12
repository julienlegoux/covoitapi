/**
 * @module DeleteTravelUseCase
 *
 * Deletes an existing carpooling travel by its UUID. Verifies the travel
 * exists before attempting deletion.
 */

import { inject, injectable } from 'tsyringe';
import { TravelNotFoundError } from '../../../lib/errors/domain.errors.js';
import type { TravelRepository } from '../../../domain/repositories/travel.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';

/**
 * Union of all possible error types returned by the delete travel use case.
 *
 * - {@link TravelNotFoundError} - No travel exists with the given UUID
 * - {@link RepositoryError} - Database-level failure during lookup or deletion
 */
type DeleteTravelError = TravelNotFoundError | RepositoryError;

/**
 * Deletes a travel after verifying it exists.
 *
 * Business flow:
 * 1. Look up the travel by UUID
 * 2. If not found, return TravelNotFoundError
 * 3. Delete the travel record
 *
 * @dependencies TravelRepository
 */
@injectable()
export class DeleteTravelUseCase {
	constructor(
		@inject(TOKENS.TravelRepository)
		private readonly travelRepository: TravelRepository,
	) {}

	/**
	 * Deletes the travel identified by the given UUID.
	 *
	 * @param id - The UUID of the travel to delete
	 * @returns A Result containing void on success, or a DeleteTravelError on failure
	 */
	async execute(id: string): Promise<Result<void, DeleteTravelError>> {
		const findResult = await this.travelRepository.findById(id);
		if (!findResult.success) {
			return findResult;
		}

		if (!findResult.value) {
			return err(new TravelNotFoundError(id));
		}

		return this.travelRepository.delete(id);
	}
}
