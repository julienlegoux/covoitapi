/**
 * @module city.repository
 * Defines the city repository interface.
 * This contract abstracts persistence operations for City records,
 * including paginated listing and lookup by city name.
 */

import type { Result } from '../../lib/shared/types/result.js';
import type { RepositoryError } from '../../lib/errors/repository.errors.js';
import type { CityEntity, CreateCityData } from '../entities/city.entity.js';

export interface CityRepository {
	/**
	 * Retrieves a paginated list of all cities.
	 * @param params - Optional pagination parameters (skip/take).
	 * @returns An object containing the data array and the total count.
	 */
	findAll(params?: { skip: number; take: number }): Promise<Result<{ data: CityEntity[]; total: number }, RepositoryError>>;

	/**
	 * Finds a city by its UUID.
	 * @param id - The UUID of the city to find.
	 * @returns The matching CityEntity, or null if not found.
	 */
	findById(id: string): Promise<Result<CityEntity | null, RepositoryError>>;

	/**
	 * Finds a city by its name.
	 * @param name - The city name to search for.
	 * @returns The matching CityEntity, or null if not found.
	 */
	findByCityName(name: string): Promise<Result<CityEntity | null, RepositoryError>>;

	/**
	 * Creates a new city record.
	 * @param data - The city data including name and zipcode.
	 * @returns The newly created CityEntity.
	 */
	create(data: CreateCityData): Promise<Result<CityEntity, RepositoryError>>;

	/**
	 * Deletes a city by UUID.
	 * @param id - The UUID of the city to delete.
	 * @returns Void on success.
	 */
	delete(id: string): Promise<Result<void, RepositoryError>>;
}
