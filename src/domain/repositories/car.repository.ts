/**
 * @module car.repository
 * Defines the car repository interface.
 * This contract abstracts persistence operations for Car records,
 * including CRUD, pagination, and license plate uniqueness checks.
 */

import type { Result } from '../../lib/shared/types/result.js';
import type { RepositoryError } from '../../lib/errors/repository.errors.js';
import type { CarEntity, CreateCarData, UpdateCarData } from '../entities/car.entity.js';

export interface CarRepository {
	/**
	 * Retrieves a paginated list of all cars.
	 * @param params - Optional pagination parameters (skip/take).
	 * @returns An object containing the data array and the total count.
	 */
	findAll(params?: { skip: number; take: number }): Promise<Result<{ data: CarEntity[]; total: number }, RepositoryError>>;

	/**
	 * Finds a car by its UUID.
	 * @param id - The UUID of the car to find.
	 * @returns The matching CarEntity, or null if not found.
	 */
	findById(id: string): Promise<Result<CarEntity | null, RepositoryError>>;

	/**
	 * Creates a new car record.
	 * @param data - The car data including license plate and model reference.
	 * @returns The newly created CarEntity.
	 */
	create(data: CreateCarData): Promise<Result<CarEntity, RepositoryError>>;

	/**
	 * Updates an existing car's fields.
	 * @param id - The UUID of the car to update.
	 * @param data - Partial update payload (licensePlate, modelRefId).
	 * @returns The updated CarEntity.
	 */
	update(id: string, data: UpdateCarData): Promise<Result<CarEntity, RepositoryError>>;

	/**
	 * Deletes a car by UUID.
	 * @param id - The UUID of the car to delete.
	 * @returns Void on success.
	 */
	delete(id: string): Promise<Result<void, RepositoryError>>;

	/**
	 * Checks whether a car with the given license plate already exists.
	 * Used to enforce license plate uniqueness before creation.
	 * @param licensePlate - The license plate to check.
	 * @returns True if a car with this license plate exists.
	 */
	existsByLicensePlate(licensePlate: string): Promise<Result<boolean, RepositoryError>>;
}
