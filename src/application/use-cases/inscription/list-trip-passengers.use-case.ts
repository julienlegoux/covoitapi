/**
 * @module ListTripPassengersUseCase
 *
 * Lists all passengers (inscriptions) for a specific carpooling trip.
 * Queries inscriptions directly by trip UUID via a relation filter.
 * Pagination is applied in-memory after fetching all inscriptions for the trip.
 */

import { inject, injectable } from 'tsyringe';
import type { InscriptionEntity } from '../../../domain/entities/inscription.entity.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import type { InscriptionRepository } from '../../../domain/repositories/inscription.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok } from '../../../lib/shared/types/result.js';
import { type PaginationParams, type PaginatedResult, buildPaginationMeta } from '../../../lib/shared/utils/pagination.util.js';

/**
 * Retrieves all passengers inscribed on a specific trip, with pagination.
 *
 * Business flow:
 * 1. Fetch all inscriptions for the trip UUID via relation filter
 * 2. Apply in-memory pagination (slice) and build pagination metadata
 *
 * @dependencies InscriptionRepository
 */
@injectable()
export class ListTripPassengersUseCase {
    private readonly logger: Logger;

    constructor(
        @inject(TOKENS.InscriptionRepository)
        private readonly inscriptionRepository: InscriptionRepository,
        @inject(TOKENS.Logger) logger: Logger,
    ) {
        this.logger = logger.child({ useCase: 'ListTripPassengersUseCase' });
    }

    /**
     * Fetches a paginated list of passengers for the given trip.
     *
     * @param tripId - The UUID of the trip to list passengers for
     * @param pagination - Optional page and limit parameters (defaults to page 1, limit 20)
     * @returns A Result containing a PaginatedResult with inscription data and pagination meta,
     *          or a RepositoryError on failure
     */
    async execute(tripId: string, pagination?: PaginationParams): Promise<Result<PaginatedResult<InscriptionEntity>, RepositoryError>> {
        const result = await this.inscriptionRepository.findByTripId(tripId);
        if (!result.success) {
            this.logger.error('Failed to list trip passengers', result.error, { tripId });
            return result;
        }
        const all = result.value;
        this.logger.info('Listed trip passengers', { tripId, count: all.length });
        const params = pagination ?? { page: 1, limit: 20 };
        const start = (params.page - 1) * params.limit;
        const data = all.slice(start, start + params.limit);
        return ok({
            data,
            meta: buildPaginationMeta(params, all.length),
        });
    }
}
