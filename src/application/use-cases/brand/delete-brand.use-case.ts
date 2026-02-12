/**
 * @module DeleteBrandUseCase
 *
 * Deletes an existing car brand by its UUID. Verifies the brand exists
 * before attempting deletion to provide a meaningful not-found error.
 */

import { inject, injectable } from 'tsyringe';
import { BrandNotFoundError } from '../../../lib/errors/domain.errors.js';
import type { BrandRepository } from '../../../domain/repositories/brand.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';

/**
 * Union of all possible error types returned by the delete brand use case.
 *
 * - {@link BrandNotFoundError} - No brand exists with the given UUID
 * - {@link RepositoryError} - Database-level failure during lookup or deletion
 */
type DeleteBrandError = BrandNotFoundError | RepositoryError;

/**
 * Deletes a car brand after verifying it exists.
 *
 * Business flow:
 * 1. Look up the brand by UUID
 * 2. If not found, return BrandNotFoundError
 * 3. Delete the brand record
 *
 * @dependencies BrandRepository
 */
@injectable()
export class DeleteBrandUseCase {
	constructor(
		@inject(TOKENS.BrandRepository)
		private readonly brandRepository: BrandRepository,
	) {}

	/**
	 * Deletes the brand identified by the given UUID.
	 *
	 * @param id - The UUID of the brand to delete
	 * @returns A Result containing void on success, or a DeleteBrandError on failure
	 */
	async execute(id: string): Promise<Result<void, DeleteBrandError>> {
		const findResult = await this.brandRepository.findById(id);
		if (!findResult.success) {
			return findResult;
		}

		if (!findResult.value) {
			return err(new BrandNotFoundError(id));
		}

		return this.brandRepository.delete(id);
	}
}
