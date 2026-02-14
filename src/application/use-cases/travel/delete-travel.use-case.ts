/**
 * @module DeleteTravelUseCase
 *
 * Deletes an existing carpooling travel by its UUID. Verifies the travel
 * exists and that the requesting driver owns it before attempting deletion.
 */

import { inject, injectable } from 'tsyringe';
import { TravelNotFoundError, DriverNotFoundError, ForbiddenError } from '../../../lib/errors/domain.errors.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import type { TravelRepository } from '../../../domain/repositories/travel.repository.js';
import type { DriverRepository } from '../../../domain/repositories/driver.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';

/**
 * Union of all possible error types returned by the delete travel use case.
 *
 * - {@link TravelNotFoundError} - No travel exists with the given UUID
 * - {@link DriverNotFoundError} - The authenticated user has no driver profile
 * - {@link ForbiddenError} - The travel does not belong to the requesting driver
 * - {@link RepositoryError} - Database-level failure during lookup or deletion
 */
type DeleteTravelError = TravelNotFoundError | DriverNotFoundError | ForbiddenError | RepositoryError;

/**
 * Deletes a travel after verifying it exists and belongs to the requesting driver.
 *
 * Business flow:
 * 1. Look up the travel by UUID
 * 2. Resolve the authenticated user to their driver profile
 * 3. Verify the travel belongs to the requesting driver
 * 4. Delete the travel record
 *
 * @dependencies TravelRepository, DriverRepository
 */
@injectable()
export class DeleteTravelUseCase {
	private readonly logger: Logger;

	constructor(
		@inject(TOKENS.TravelRepository)
		private readonly travelRepository: TravelRepository,
		@inject(TOKENS.DriverRepository)
		private readonly driverRepository: DriverRepository,
		@inject(TOKENS.Logger) logger: Logger,
	) {
		this.logger = logger.child({ useCase: 'DeleteTravelUseCase' });
	}

	/**
	 * Deletes the travel identified by the given UUID, after verifying ownership.
	 *
	 * @param input - Object containing the travel UUID and the authenticated userId
	 * @returns A Result containing void on success, or a DeleteTravelError on failure
	 */
	async execute(input: { id: string; userId: string }): Promise<Result<void, DeleteTravelError>> {
		const findResult = await this.travelRepository.findById(input.id);
		if (!findResult.success) {
			return findResult;
		}

		if (!findResult.value) {
			this.logger.warn('Travel not found for deletion', { travelId: input.id });
			return err(new TravelNotFoundError(input.id));
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
			this.logger.warn('Ownership check failed for travel deletion', { travelId: input.id, userId: input.userId });
			return err(new ForbiddenError('Travel', input.id));
		}

		const deleteResult = await this.travelRepository.delete(input.id);
		if (deleteResult.success) {
			this.logger.info('Travel deleted', { travelId: input.id });
		}
		return deleteResult;
	}
}
