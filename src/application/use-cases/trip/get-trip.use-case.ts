/**
 * @module GetTripUseCase
 *
 * Retrieves a single carpooling trip by its UUID.
 * Returns a not-found error if the trip does not exist.
 */

import { inject, injectable } from 'tsyringe';
import type { TripEntity } from '../../../domain/entities/trip.entity.js';
import { TripNotFoundError } from '../../../lib/errors/domain.errors.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import type { TripRepository } from '../../../domain/repositories/trip.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok, err } from '../../../lib/shared/types/result.js';

/**
 * Union of all possible error types returned by the get trip use case.
 *
 * - {@link TripNotFoundError} - No trip exists with the given UUID
 * - {@link RepositoryError} - Database-level failure during lookup
 */
type GetTripError = TripNotFoundError | RepositoryError;

/**
 * Fetches a single trip by UUID.
 *
 * Business flow:
 * 1. Look up the trip by UUID
 * 2. If not found, return TripNotFoundError
 * 3. Return the trip entity
 *
 * @dependencies TripRepository
 */
@injectable()
export class GetTripUseCase {
    private readonly logger: Logger;

    constructor(
        @inject(TOKENS.TripRepository)
        private readonly tripRepository: TripRepository,
        @inject(TOKENS.Logger) logger: Logger,
    ) {
        this.logger = logger.child({ useCase: 'GetTripUseCase' });
    }

    /**
     * Retrieves the trip identified by the given UUID.
     *
     * @param id - The UUID of the trip to retrieve
     * @returns A Result containing the TripEntity on success,
     *          or a GetTripError on failure
     */
    async execute(id: string): Promise<Result<TripEntity, GetTripError>> {
        const result = await this.tripRepository.findById(id);
        if (!result.success) {
            return result;
        }

        if (!result.value) {
            return err(new TripNotFoundError(id));
        }

        return ok(result.value);
    }
}
