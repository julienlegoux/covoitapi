/**
 * @module DeleteInscriptionUseCase
 *
 * Cancels (deletes) a passenger inscription from a carpooling travel.
 * Verifies the inscription exists and that the requesting user owns it
 * before attempting deletion.
 */

import { inject, injectable } from 'tsyringe';
import { InscriptionNotFoundError, UserNotFoundError, ForbiddenError } from '../../../lib/errors/domain.errors.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import type { InscriptionRepository } from '../../../domain/repositories/inscription.repository.js';
import type { UserRepository } from '../../../domain/repositories/user.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';

/**
 * Union of all possible error types returned by the delete inscription use case.
 *
 * - {@link InscriptionNotFoundError} - No inscription exists with the given UUID
 * - {@link UserNotFoundError} - The authenticated user cannot be found
 * - {@link ForbiddenError} - The inscription does not belong to the requesting user
 * - {@link RepositoryError} - Database-level failure during lookup or deletion
 */
type DeleteInscriptionError = InscriptionNotFoundError | UserNotFoundError | ForbiddenError | RepositoryError;

/**
 * Deletes an inscription after verifying it exists and belongs to the requesting user.
 *
 * Business flow:
 * 1. Look up the inscription by UUID
 * 2. Resolve the authenticated user to get their refId
 * 3. Verify the inscription belongs to the requesting user
 * 4. Delete the inscription record, freeing a seat on the travel
 *
 * @dependencies InscriptionRepository, UserRepository
 */
@injectable()
export class DeleteInscriptionUseCase {
	private readonly logger: Logger;

	constructor(
		@inject(TOKENS.InscriptionRepository)
		private readonly inscriptionRepository: InscriptionRepository,
		@inject(TOKENS.UserRepository)
		private readonly userRepository: UserRepository,
		@inject(TOKENS.Logger) logger: Logger,
	) {
		this.logger = logger.child({ useCase: 'DeleteInscriptionUseCase' });
	}

	/**
	 * Deletes the inscription identified by the given UUID, after verifying ownership.
	 *
	 * @param input - Object containing the inscription UUID and the authenticated userId
	 * @returns A Result containing void on success, or a DeleteInscriptionError on failure
	 */
	async execute(input: { id: string; userId: string }): Promise<Result<void, DeleteInscriptionError>> {
		const findResult = await this.inscriptionRepository.findById(input.id);
		if (!findResult.success) {
			return findResult;
		}

		if (!findResult.value) {
			this.logger.warn('Inscription not found for deletion', { inscriptionId: input.id });
			return err(new InscriptionNotFoundError(input.id));
		}

		// Ownership check: resolve user UUID to refId, compare with inscription's userRefId
		const userResult = await this.userRepository.findById(input.userId);
		if (!userResult.success) {
			return userResult;
		}
		if (!userResult.value) {
			return err(new UserNotFoundError(input.userId));
		}

		if (findResult.value.userRefId !== userResult.value.refId) {
			this.logger.warn('Ownership check failed for inscription deletion', { inscriptionId: input.id, userId: input.userId });
			return err(new ForbiddenError('Inscription', input.id));
		}

		const deleteResult = await this.inscriptionRepository.delete(input.id);
		if (deleteResult.success) {
			this.logger.info('Inscription deleted', { inscriptionId: input.id });
		}
		return deleteResult;
	}
}
