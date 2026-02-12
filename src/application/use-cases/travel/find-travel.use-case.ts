/**
 * @module FindTravelUseCase
 *
 * Searches for carpooling travels matching optional filters (departure city,
 * arrival city, date). This is the main discovery endpoint for passengers
 * looking for a ride.
 */

import { inject, injectable } from 'tsyringe';
import type { TravelEntity } from '../../../domain/entities/travel.entity.js';
import type { TravelRepository } from '../../../domain/repositories/travel.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import type { FindTravelQueryType } from '../../schemas/travel.schema.js';

/**
 * Searches for travels matching the given filter criteria.
 *
 * All filters are optional -- providing none returns all travels.
 * The date string is converted to a Date object before being passed
 * to the repository.
 *
 * @dependencies TravelRepository
 */
@injectable()
export class FindTravelUseCase {
	constructor(
		@inject(TOKENS.TravelRepository)
		private readonly travelRepository: TravelRepository,
	) {}

	/**
	 * Finds travels matching the provided filters.
	 *
	 * @param input - Query object with optional departureCity, arrivalCity, and date
	 * @returns A Result containing an array of matching TravelEntity records,
	 *          or a RepositoryError on database failure
	 */
	async execute(input: FindTravelQueryType): Promise<Result<TravelEntity[], RepositoryError>> {
		return this.travelRepository.findByFilters({
			departureCity: input.departureCity,
			arrivalCity: input.arrivalCity,
			date: input.date ? new Date(input.date) : undefined,
		});
	}
}
