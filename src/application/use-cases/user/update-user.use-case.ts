/**
 * @module UpdateUserUseCase
 *
 * Partially updates a user's profile information (firstName, lastName, phone).
 * These fields are initially null after registration and are populated
 * through this use case.
 */

import { inject, injectable } from 'tsyringe';
import type { PublicUserEntity, UpdateUserData } from '../../../domain/entities/user.entity.js';
import { UserNotFoundError } from '../../../lib/errors/domain.errors.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import type { UserRepository } from '../../../domain/repositories/user.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';

/**
 * Union of all possible error types returned by the update user use case.
 *
 * - {@link UserNotFoundError} - No user exists with the given UUID
 * - {@link RepositoryError} - Database-level failure during lookup or update
 */
type UpdateUserError = UserNotFoundError | RepositoryError;

/** Input type for partial profile updates. All fields are optional. */
export type UpdateProfileInput = {
	firstName?: string;
	lastName?: string;
	phone?: string;
};

/**
 * Partially updates a user's profile fields.
 *
 * Business flow:
 * 1. Verify the user exists by UUID
 * 2. Build a partial update payload from the provided fields
 * 3. Persist the update and return the updated public profile
 *
 * @dependencies UserRepository
 */
@injectable()
export class UpdateUserUseCase {
	private readonly logger: Logger;

	constructor(
		@inject(TOKENS.UserRepository)
		private readonly userRepository: UserRepository,
		@inject(TOKENS.Logger) logger: Logger,
	) {
		this.logger = logger.child({ useCase: 'UpdateUserUseCase' });
	}

	/**
	 * Applies a partial update to the user's profile.
	 *
	 * @param id - The UUID of the user to update
	 * @param input - Object with optional firstName, lastName, and phone fields
	 * @returns A Result containing the updated PublicUserEntity on success,
	 *          or an UpdateUserError on failure
	 */
	async execute(id: string, input: UpdateProfileInput): Promise<Result<PublicUserEntity, UpdateUserError>> {
		const findResult = await this.userRepository.findById(id);
		if (!findResult.success) {
			return findResult;
		}

		if (!findResult.value || findResult.value.anonymizedAt !== null) {
			this.logger.warn('User not found for update', { userId: id });
			return err(new UserNotFoundError(id));
		}

		const updateData: UpdateUserData = {};
		if (input.firstName) updateData.firstName = input.firstName;
		if (input.lastName) updateData.lastName = input.lastName;
		if (input.phone) updateData.phone = input.phone;

		const result = await this.userRepository.update(id, updateData);
		if (result.success) {
			this.logger.info('User updated', { userId: id });
		}
		return result;
	}
}
