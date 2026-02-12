/**
 * @module brand.repository
 * Defines the brand repository interface.
 * This contract abstracts persistence operations for car Brand records (manufacturers).
 */

import type { Result } from '../../lib/shared/types/result.js';
import type { RepositoryError } from '../../lib/errors/repository.errors.js';
import type { BrandEntity, CreateBrandData } from '../entities/brand.entity.js';

export interface BrandRepository {
	/**
	 * Retrieves a paginated list of all brands.
	 * @param params - Optional pagination parameters (skip/take).
	 * @returns An object containing the data array and the total count.
	 */
	findAll(params?: { skip: number; take: number }): Promise<Result<{ data: BrandEntity[]; total: number }, RepositoryError>>;

	/**
	 * Finds a brand by its UUID.
	 * @param id - The UUID of the brand to find.
	 * @returns The matching BrandEntity, or null if not found.
	 */
	findById(id: string): Promise<Result<BrandEntity | null, RepositoryError>>;

	/**
	 * Creates a new brand record.
	 * @param data - The brand data containing the name.
	 * @returns The newly created BrandEntity.
	 */
	create(data: CreateBrandData): Promise<Result<BrandEntity, RepositoryError>>;

	/**
	 * Deletes a brand by UUID.
	 * @param id - The UUID of the brand to delete.
	 * @returns Void on success.
	 */
	delete(id: string): Promise<Result<void, RepositoryError>>;
}
