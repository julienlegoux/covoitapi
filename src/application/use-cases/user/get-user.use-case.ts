/**
 * @module GetUserUseCase
 *
 * Retrieves a single user's public profile by UUID. Anonymized users
 * are treated as not found to prevent exposing scrubbed records.
 */

import { inject, injectable } from 'tsyringe';
import type { PublicUserEntity } from '../../../domain/entities/user.entity.js';
import { UserNotFoundError } from '../../../lib/errors/domain.errors.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import type { UserRepository } from '../../../domain/repositories/user.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok, err } from '../../../lib/shared/types/result.js';

/**
 * Union of all possible error types returned by the get user use case.
 *
 * - {@link UserNotFoundError} - No user exists with the given UUID, or the user is anonymized
 * - {@link RepositoryError} - Database-level failure during lookup
 */
type GetUserError = UserNotFoundError | RepositoryError;

/**
 * Fetches a single user's public profile by UUID.
 *
 * Business flow:
 * 1. Look up the user by UUID
 * 2. If not found or anonymized (anonymizedAt is set), return UserNotFoundError
 * 3. Return the public user entity (includes email from Auth join)
 *
 * @dependencies UserRepository
 */
@injectable()
export class GetUserUseCase {
	private readonly logger: Logger;

	constructor(
		@inject(TOKENS.UserRepository)
		private readonly userRepository: UserRepository,
		@inject(TOKENS.Logger) logger: Logger,
	) {
		this.logger = logger.child({ useCase: 'GetUserUseCase' });
	}

	/**
	 * Retrieves the public profile of the user identified by UUID.
	 *
	 * @param id - The UUID of the user to retrieve
	 * @returns A Result containing the PublicUserEntity on success,
	 *          or a GetUserError on failure
	 */
	async execute(id: string): Promise<Result<PublicUserEntity, GetUserError>> {
		const result = await this.userRepository.findById(id);
		if (!result.success) {
			this.logger.error('Failed to get user', result.error, { userId: id });
			return result;
		}

		if (!result.value || result.value.anonymizedAt !== null) {
			this.logger.warn('User not found', { userId: id });
			return err(new UserNotFoundError(id));
		}

		return ok(result.value);
	}
}
