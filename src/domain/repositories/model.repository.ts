/**
 * @module model.repository
 * Defines the car model repository interface.
 * This contract abstracts persistence operations for car Model records,
 * including lookup by name+brand combination to prevent duplicates.
 */

import type { Result } from '../../lib/shared/types/result.js';
import type { RepositoryError } from '../../lib/errors/repository.errors.js';
import type { CreateModelData, ModelEntity } from '../entities/model.entity.js';

export interface ModelRepository {
	/**
	 * Retrieves all car models.
	 * @returns An array of all ModelEntity records.
	 */
	findAll(): Promise<Result<ModelEntity[], RepositoryError>>;

	/**
	 * Finds a car model by its UUID.
	 * @param id - The UUID of the model to find.
	 * @returns The matching ModelEntity, or null if not found.
	 */
	findById(id: string): Promise<Result<ModelEntity | null, RepositoryError>>;

	/**
	 * Finds a car model by its name and brand combination.
	 * Used to check for duplicates before creating a new model.
	 * @param name - The model name to search for.
	 * @param brandRefId - The integer refId of the brand.
	 * @returns The matching ModelEntity, or null if not found.
	 */
	findByNameAndBrand(name: string, brandRefId: number): Promise<Result<ModelEntity | null, RepositoryError>>;

	/**
	 * Creates a new car model record.
	 * @param data - The model data including name and brand reference.
	 * @returns The newly created ModelEntity.
	 */
	create(data: CreateModelData): Promise<Result<ModelEntity, RepositoryError>>;
}
