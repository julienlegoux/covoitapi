/**
 * @module trip.repository
 * Defines the trip repository interface and search filter types.
 * This contract abstracts persistence operations for Trip (carpooling journey) records,
 * including paginated listing, filtered search, and CRUD operations.
 */

import type { Result } from '../../lib/shared/types/result.js';
import type { RepositoryError } from '../../lib/errors/repository.errors.js';
import type { CreateTripData, TripEntity } from '../entities/trip.entity.js';

/**
 * Optional filters for searching trips.
 *
 * @property departureCity - Filter by departure city name.
 * @property arrivalCity - Filter by arrival city name.
 * @property date - Filter by trip date.
 */
export type TripFilters = {
    departureCity?: string;
    arrivalCity?: string;
    date?: Date;
};

export interface TripRepository {
    /**
     * Retrieves a paginated list of all trips.
     * @param params - Optional pagination parameters (skip/take).
     * @returns An object containing the data array and the total count.
     */
    findAll(params?: { skip: number; take: number }): Promise<Result<{ data: TripEntity[]; total: number }, RepositoryError>>;

    /**
     * Finds a trip by its UUID.
     * @param id - The UUID of the trip to find.
     * @returns The matching TripEntity, or null if not found.
     */
    findById(id: string): Promise<Result<TripEntity | null, RepositoryError>>;

    /**
     * Searches trips matching the given filters.
     * @param filters - Optional filters for departure city, arrival city, and date.
     * @returns An array of matching TripEntity records.
     */
    findByFilters(filters: TripFilters): Promise<Result<TripEntity[], RepositoryError>>;

    /**
     * Creates a new trip, optionally linking it to cities.
     * @param data - The trip data including driver, car, and optional city associations.
     * @returns The newly created TripEntity.
     */
    create(data: CreateTripData): Promise<Result<TripEntity, RepositoryError>>;

    /**
     * Deletes a trip by UUID.
     * @param id - The UUID of the trip to delete.
     * @returns Void on success.
     */
    delete(id: string): Promise<Result<void, RepositoryError>>;
}
