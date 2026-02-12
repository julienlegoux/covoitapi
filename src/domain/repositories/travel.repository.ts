/**
 * @module travel.repository
 * Defines the travel repository interface and search filter types.
 * This contract abstracts persistence operations for Travel (carpooling trip) records,
 * including paginated listing, filtered search, and CRUD operations.
 */

import type { Result } from '../../lib/shared/types/result.js';
import type { RepositoryError } from '../../lib/errors/repository.errors.js';
import type { CreateTravelData, TravelEntity } from '../entities/travel.entity.js';

/**
 * Optional filters for searching travel routes.
 *
 * @property departureCity - Filter by departure city name.
 * @property arrivalCity - Filter by arrival city name.
 * @property date - Filter by travel date.
 */
export type TravelFilters = {
	departureCity?: string;
	arrivalCity?: string;
	date?: Date;
};

export interface TravelRepository {
	/**
	 * Retrieves a paginated list of all travel routes.
	 * @param params - Optional pagination parameters (skip/take).
	 * @returns An object containing the data array and the total count.
	 */
	findAll(params?: { skip: number; take: number }): Promise<Result<{ data: TravelEntity[]; total: number }, RepositoryError>>;

	/**
	 * Finds a travel route by its UUID.
	 * @param id - The UUID of the travel to find.
	 * @returns The matching TravelEntity, or null if not found.
	 */
	findById(id: string): Promise<Result<TravelEntity | null, RepositoryError>>;

	/**
	 * Searches travel routes matching the given filters.
	 * @param filters - Optional filters for departure city, arrival city, and date.
	 * @returns An array of matching TravelEntity records.
	 */
	findByFilters(filters: TravelFilters): Promise<Result<TravelEntity[], RepositoryError>>;

	/**
	 * Creates a new travel route, optionally linking it to cities.
	 * @param data - The travel data including driver, car, and optional city associations.
	 * @returns The newly created TravelEntity.
	 */
	create(data: CreateTravelData): Promise<Result<TravelEntity, RepositoryError>>;

	/**
	 * Deletes a travel route by UUID.
	 * @param id - The UUID of the travel to delete.
	 * @returns Void on success.
	 */
	delete(id: string): Promise<Result<void, RepositoryError>>;
}
