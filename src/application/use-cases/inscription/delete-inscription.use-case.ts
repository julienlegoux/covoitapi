/**
 * @module DeleteInscriptionUseCase
 *
 * Cancels (deletes) a passenger inscription from a carpooling travel.
 * Verifies the inscription exists before attempting deletion.
 */

import { inject, injectable } from 'tsyringe';
import { InscriptionNotFoundError } from '../../../lib/errors/domain.errors.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import type { InscriptionRepository } from '../../../domain/repositories/inscription.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';

/**
 * Union of all possible error types returned by the delete inscription use case.
 *
 * - {@link InscriptionNotFoundError} - No inscription exists with the given UUID
 * - {@link RepositoryError} - Database-level failure during lookup or deletion
 */
type DeleteInscriptionError = InscriptionNotFoundError | RepositoryError;

/**
 * Deletes an inscription after verifying it exists.
 *
 * Business flow:
 * 1. Look up the inscription by UUID
 * 2. If not found, return InscriptionNotFoundError
 * 3. Delete the inscription record, freeing a seat on the travel
 *
 * @dependencies InscriptionRepository
 */
@injectable()
export class DeleteInscriptionUseCase {
	private readonly logger: Logger;

	constructor(
		@inject(TOKENS.InscriptionRepository)
		private readonly inscriptionRepository: InscriptionRepository,
		@inject(TOKENS.Logger) logger: Logger,
	) {
		this.logger = logger.child({ useCase: 'DeleteInscriptionUseCase' });
	}

	/**
	 * Deletes the inscription identified by the given UUID.
	 *
	 * @param id - The UUID of the inscription to delete
	 * @returns A Result containing void on success, or a DeleteInscriptionError on failure
	 */
	async execute(id: string): Promise<Result<void, DeleteInscriptionError>> {
		const findResult = await this.inscriptionRepository.findById(id);
		if (!findResult.success) {
			return findResult;
		}

		if (!findResult.value) {
			this.logger.warn('Inscription not found for deletion', { inscriptionId: id });
			return err(new InscriptionNotFoundError(id));
		}

		const deleteResult = await this.inscriptionRepository.delete(id);
		if (deleteResult.success) {
			this.logger.info('Inscription deleted', { inscriptionId: id });
		}
		return deleteResult;
	}
}
