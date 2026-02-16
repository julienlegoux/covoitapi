/**
 * @module FindTripUseCase
 *
 * Searches for carpooling trips matching optional filters (departure city,
 * arrival city, date). This is the main discovery endpoint for passengers
 * looking for a ride.
 */

import { inject, injectable } from 'tsyringe';
import type { TripEntity } from '../../../domain/entities/trip.entity.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import type { TripRepository } from '../../../domain/repositories/trip.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import type { FindTripQueryType } from '../../schemas/trip.schema.js';

/**
 * Searches for trips matching the given filter criteria.
 *
 * All filters are optional -- providing none returns all trips.
 * The date string is converted to a Date object before being passed
 * to the repository.
 *
 * @dependencies TripRepository
 */
@injectable()
export class FindTripUseCase {
    private readonly logger: Logger;

    constructor(
        @inject(TOKENS.TripRepository)
        private readonly tripRepository: TripRepository,
        @inject(TOKENS.Logger) logger: Logger,
    ) {
        this.logger = logger.child({ useCase: 'FindTripUseCase' });
    }

    /**
     * Finds trips matching the provided filters.
     *
     * @param input - Query object with optional departureCity, arrivalCity, and date
     * @returns A Result containing an array of matching TripEntity records,
     *          or a RepositoryError on database failure
     */
    async execute(input: FindTripQueryType): Promise<Result<TripEntity[], RepositoryError>> {
        this.logger.info('Searching trips', { filters: input });
        const result = await this.tripRepository.findByFilters({
            departureCity: input.departureCity,
            arrivalCity: input.arrivalCity,
            date: input.date ? new Date(input.date) : undefined,
        });
        if (!result.success) {
            this.logger.error('Failed to search trips', { error: result.error });
        }
        return result;
    }
}
