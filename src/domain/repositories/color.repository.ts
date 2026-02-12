/**
 * @module color.repository
 * Defines the color repository interface and its data types.
 * This contract abstracts persistence operations for Color records,
 * including CRUD, lookup by name, and pagination.
 */

import type { Result } from '../../lib/shared/types/result.js';
import type { RepositoryError } from '../../lib/errors/repository.errors.js';
import type { ColorEntity } from '../entities/color.entity.js';

/**
 * Data required to create a new color record.
 * Excludes auto-generated fields (id, refId).
 */
export type CreateColorData = Omit<ColorEntity, 'id' | 'refId'>;

/**
 * Partial update payload for modifying color fields.
 * Any subset of name and hex can be provided.
 */
export type UpdateColorData = Partial<Omit<ColorEntity, 'id' | 'refId'>>;

export interface ColorRepository {
	/**
	 * Retrieves a paginated list of all colors.
	 * @param params - Optional pagination parameters (skip/take).
	 * @returns An object containing the data array and the total count.
	 */
	findAll(params?: { skip: number; take: number }): Promise<Result<{ data: ColorEntity[]; total: number }, RepositoryError>>;

	/**
	 * Finds a color by its UUID.
	 * @param id - The UUID of the color to find.
	 * @returns The matching ColorEntity, or null if not found.
	 */
	findById(id: string): Promise<Result<ColorEntity | null, RepositoryError>>;

	/**
	 * Finds a color by its name.
	 * @param name - The color name to search for.
	 * @returns The matching ColorEntity, or null if not found.
	 */
	findByName(name: string): Promise<Result<ColorEntity | null, RepositoryError>>;

	/**
	 * Creates a new color record.
	 * @param data - The color data including name and hex code.
	 * @returns The newly created ColorEntity.
	 */
	create(data: CreateColorData): Promise<Result<ColorEntity, RepositoryError>>;

	/**
	 * Updates an existing color's fields.
	 * @param id - The UUID of the color to update.
	 * @param data - Partial update payload (name, hex).
	 * @returns The updated ColorEntity.
	 */
	update(id: string, data: UpdateColorData): Promise<Result<ColorEntity, RepositoryError>>;

	/**
	 * Deletes a color by UUID.
	 * @param id - The UUID of the color to delete.
	 * @returns Void on success.
	 */
	delete(id: string): Promise<Result<void, RepositoryError>>;
}
