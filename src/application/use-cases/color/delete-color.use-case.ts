/**
 * @module DeleteColorUseCase
 *
 * Deletes an existing color by its UUID. Verifies the color exists
 * before attempting deletion to provide a meaningful not-found error.
 */

import { inject, injectable } from 'tsyringe';
import { ColorNotFoundError } from '../../../lib/errors/domain.errors.js';
import type { ColorRepository } from '../../../domain/repositories/color.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';

/**
 * Union of all possible error types returned by the delete color use case.
 *
 * - {@link ColorNotFoundError} - No color exists with the given UUID
 * - {@link RepositoryError} - Database-level failure during lookup or deletion
 */
type DeleteColorError = ColorNotFoundError | RepositoryError;

/**
 * Deletes a color after verifying it exists.
 *
 * Business flow:
 * 1. Look up the color by UUID
 * 2. If not found, return ColorNotFoundError
 * 3. Delete the color record
 *
 * @dependencies ColorRepository
 */
@injectable()
export class DeleteColorUseCase {
	constructor(
		@inject(TOKENS.ColorRepository)
		private readonly colorRepository: ColorRepository,
	) {}

	/**
	 * Deletes the color identified by the given UUID.
	 *
	 * @param id - The UUID of the color to delete
	 * @returns A Result containing void on success, or a DeleteColorError on failure
	 */
	async execute(id: string): Promise<Result<void, DeleteColorError>> {
		const findResult = await this.colorRepository.findById(id);
		if (!findResult.success) {
			return findResult;
		}

		if (!findResult.value) {
			return err(new ColorNotFoundError(id));
		}

		return this.colorRepository.delete(id);
	}
}
