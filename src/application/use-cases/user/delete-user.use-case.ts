/**
 * @module DeleteUserUseCase
 *
 * Hard-deletes a user record by its UUID. Verifies the user exists
 * before attempting deletion. For soft-deletion (GDPR), prefer
 * the AnonymizeUserUseCase instead.
 */

import { inject, injectable } from 'tsyringe';
import { UserNotFoundError } from '../../../lib/errors/domain.errors.js';
import type { UserRepository } from '../../../domain/repositories/user.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';

/**
 * Union of all possible error types returned by the delete user use case.
 *
 * - {@link UserNotFoundError} - No user exists with the given UUID
 * - {@link RepositoryError} - Database-level failure during lookup or deletion
 */
type DeleteUserError = UserNotFoundError | RepositoryError;

/**
 * Hard-deletes a user after verifying they exist.
 *
 * Business flow:
 * 1. Look up the user by UUID
 * 2. If not found, return UserNotFoundError
 * 3. Delete the user record
 *
 * @dependencies UserRepository
 */
@injectable()
export class DeleteUserUseCase {
	constructor(
		@inject(TOKENS.UserRepository)
		private readonly userRepository: UserRepository,
	) {}

	/**
	 * Deletes the user identified by the given UUID.
	 *
	 * @param id - The UUID of the user to delete
	 * @returns A Result containing void on success, or a DeleteUserError on failure
	 */
	async execute(id: string): Promise<Result<void, DeleteUserError>> {
		const findResult = await this.userRepository.findById(id);
		if (!findResult.success) {
			return findResult;
		}

		if (!findResult.value) {
			return err(new UserNotFoundError(id));
		}

		return this.userRepository.delete(id);
	}
}
