/**
 * @module AnonymizeUserUseCase
 *
 * Anonymizes a user's personal data in compliance with GDPR or similar
 * data protection requirements. The user's profile fields are scrubbed
 * and an anonymizedAt timestamp is set, but the record is not deleted
 * so that referential integrity is preserved.
 */

import { inject, injectable } from 'tsyringe';
import { UserNotFoundError } from '../../../lib/errors/domain.errors.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import type { UserRepository } from '../../../domain/repositories/user.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';

/**
 * Union of all possible error types returned by the anonymize user use case.
 *
 * - {@link UserNotFoundError} - No user exists with the given UUID
 * - {@link RepositoryError} - Database-level failure during lookup or anonymization
 */
type AnonymizeUserError = UserNotFoundError | RepositoryError;

/**
 * Anonymizes a user's personal data while preserving the record.
 *
 * Business flow:
 * 1. Look up the user by UUID
 * 2. If not found, return UserNotFoundError
 * 3. Anonymize the user's profile data via the repository
 *
 * @dependencies UserRepository
 */
@injectable()
export class AnonymizeUserUseCase {
	private readonly logger: Logger;

	constructor(
		@inject(TOKENS.UserRepository)
		private readonly userRepository: UserRepository,
		@inject(TOKENS.Logger) logger: Logger,
	) {
		this.logger = logger.child({ useCase: 'AnonymizeUserUseCase' });
	}

	/**
	 * Anonymizes the user identified by the given UUID.
	 *
	 * @param id - The UUID of the user to anonymize
	 * @returns A Result containing void on success, or an AnonymizeUserError on failure
	 */
	async execute(id: string): Promise<Result<void, AnonymizeUserError>> {
		const findResult = await this.userRepository.findById(id);
		if (!findResult.success) {
			return findResult;
		}

		if (!findResult.value) {
			this.logger.warn('User not found for anonymization', { userId: id });
			return err(new UserNotFoundError(id));
		}

		const result = await this.userRepository.anonymize(id);
		if (result.success) {
			this.logger.info('User anonymized', { userId: id });
		}
		return result;
	}
}
