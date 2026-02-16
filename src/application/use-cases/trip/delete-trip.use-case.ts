/**
 * @module DeleteTripUseCase
 *
 * Deletes an existing carpooling trip by its UUID. Verifies the trip
 * exists and that the requesting driver owns it before attempting deletion.
 */

import { inject, injectable } from 'tsyringe';
import { TripNotFoundError, DriverNotFoundError, ForbiddenError } from '../../../lib/errors/domain.errors.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import type { TripRepository } from '../../../domain/repositories/trip.repository.js';
import type { DriverRepository } from '../../../domain/repositories/driver.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';

/**
 * Union of all possible error types returned by the delete trip use case.
 *
 * - {@link TripNotFoundError} - No trip exists with the given UUID
 * - {@link DriverNotFoundError} - The authenticated user has no driver profile
 * - {@link ForbiddenError} - The trip does not belong to the requesting driver
 * - {@link RepositoryError} - Database-level failure during lookup or deletion
 */
type DeleteTripError = TripNotFoundError | DriverNotFoundError | ForbiddenError | RepositoryError;

/**
 * Deletes a trip after verifying it exists and belongs to the requesting driver.
 *
 * Business flow:
 * 1. Look up the trip by UUID
 * 2. Resolve the authenticated user to their driver profile
 * 3. Verify the trip belongs to the requesting driver
 * 4. Delete the trip record
 *
 * @dependencies TripRepository, DriverRepository
 */
@injectable()
export class DeleteTripUseCase {
    private readonly logger: Logger;

    constructor(
        @inject(TOKENS.TripRepository)
        private readonly tripRepository: TripRepository,
        @inject(TOKENS.DriverRepository)
        private readonly driverRepository: DriverRepository,
        @inject(TOKENS.Logger) logger: Logger,
    ) {
        this.logger = logger.child({ useCase: 'DeleteTripUseCase' });
    }

    /**
     * Deletes the trip identified by the given UUID, after verifying ownership.
     *
     * @param input - Object containing the trip UUID and the authenticated userId
     * @returns A Result containing void on success, or a DeleteTripError on failure
     */
    async execute(input: { id: string; userId: string }): Promise<Result<void, DeleteTripError>> {
        const findResult = await this.tripRepository.findById(input.id);
        if (!findResult.success) {
            return findResult;
        }

        if (!findResult.value) {
            this.logger.warn('Trip not found for deletion', { tripId: input.id });
            return err(new TripNotFoundError(input.id));
        }

        // Ownership check: resolve user UUID → driver via relation filter (single query)
        const driverResult = await this.driverRepository.findByUserId(input.userId);
        if (!driverResult.success) {
            return driverResult;
        }
        if (!driverResult.value) {
            return err(new DriverNotFoundError(input.userId));
        }

        if (findResult.value.driverRefId !== driverResult.value.refId) {
            this.logger.warn('Ownership check failed for trip deletion', { tripId: input.id, userId: input.userId });
            return err(new ForbiddenError('Trip', input.id));
        }

        const deleteResult = await this.tripRepository.delete(input.id);
        if (deleteResult.success) {
            this.logger.info('Trip deleted', { tripId: input.id });
        }
        return deleteResult;
    }
}
