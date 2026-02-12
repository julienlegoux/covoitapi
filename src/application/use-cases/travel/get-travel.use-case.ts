/**
 * @module GetTravelUseCase
 *
 * Retrieves a single carpooling travel by its UUID.
 * Returns a not-found error if the travel does not exist.
 */

import { inject, injectable } from 'tsyringe';
import type { TravelEntity } from '../../../domain/entities/travel.entity.js';
import { TravelNotFoundError } from '../../../lib/errors/domain.errors.js';
import type { TravelRepository } from '../../../domain/repositories/travel.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok, err } from '../../../lib/shared/types/result.js';

/**
 * Union of all possible error types returned by the get travel use case.
 *
 * - {@link TravelNotFoundError} - No travel exists with the given UUID
 * - {@link RepositoryError} - Database-level failure during lookup
 */
type GetTravelError = TravelNotFoundError | RepositoryError;

/**
 * Fetches a single travel by UUID.
 *
 * Business flow:
 * 1. Look up the travel by UUID
 * 2. If not found, return TravelNotFoundError
 * 3. Return the travel entity
 *
 * @dependencies TravelRepository
 */
@injectable()
export class GetTravelUseCase {
	constructor(
		@inject(TOKENS.TravelRepository)
		private readonly travelRepository: TravelRepository,
	) {}

	/**
	 * Retrieves the travel identified by the given UUID.
	 *
	 * @param id - The UUID of the travel to retrieve
	 * @returns A Result containing the TravelEntity on success,
	 *          or a GetTravelError on failure
	 */
	async execute(id: string): Promise<Result<TravelEntity, GetTravelError>> {
		const result = await this.travelRepository.findById(id);
		if (!result.success) {
			return result;
		}

		if (!result.value) {
			return err(new TravelNotFoundError(id));
		}

		return ok(result.value);
	}
}
