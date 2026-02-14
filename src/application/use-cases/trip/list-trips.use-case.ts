/**
 * @module ListTripsUseCase
 *
 * Retrieves a paginated list of all carpooling trips on the platform.
 */

import { inject, injectable } from 'tsyringe';
import type { TripEntity } from '../../../domain/entities/trip.entity.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import type { TripRepository } from '../../../domain/repositories/trip.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok } from '../../../lib/shared/types/result.js';
import { type PaginationParams, type PaginatedResult, toSkipTake, buildPaginationMeta } from '../../../lib/shared/utils/pagination.util.js';

/**
 * Returns a paginated list of trips with metadata.
 *
 * @dependencies TripRepository
 */
@injectable()
export class ListTripsUseCase {
    private readonly logger: Logger;

    constructor(
        @inject(TOKENS.TripRepository)
        private readonly tripRepository: TripRepository,
        @inject(TOKENS.Logger) logger: Logger,
    ) {
        this.logger = logger.child({ useCase: 'ListTripsUseCase' });
    }

    /**
     * Fetches a paginated page of trips.
     *
     * @param pagination - Optional page and limit parameters (defaults to page 1, limit 20)
     * @returns A Result containing a PaginatedResult with trip data and pagination meta,
     *          or a RepositoryError on database failure
     */
    async execute(pagination?: PaginationParams): Promise<Result<PaginatedResult<TripEntity>, RepositoryError>> {
        const result = await this.tripRepository.findAll(pagination ? toSkipTake(pagination) : undefined);
        if (!result.success) return result;
        const { data, total } = result.value;
        return ok({
            data,
            meta: buildPaginationMeta(pagination ?? { page: 1, limit: 20 }, total),
        });
    }
}
