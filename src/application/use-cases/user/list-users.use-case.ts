/**
 * @module ListUsersUseCase
 *
 * Retrieves a list of all public user profiles on the platform.
 * Returns the PublicUserEntity type which includes the email from the Auth join.
 */

import { inject, injectable } from 'tsyringe';
import type { PublicUserEntity } from '../../../domain/entities/user.entity.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import type { UserRepository } from '../../../domain/repositories/user.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';

/**
 * Returns all public user profiles.
 *
 * This is a straightforward passthrough to the repository.
 * No pagination is applied (the full list is returned).
 *
 * @dependencies UserRepository
 */
@injectable()
export class ListUsersUseCase {
	private readonly logger: Logger;

	constructor(
		@inject(TOKENS.UserRepository)
		private readonly userRepository: UserRepository,
		@inject(TOKENS.Logger) logger: Logger,
	) {
		this.logger = logger.child({ useCase: 'ListUsersUseCase' });
	}

	/**
	 * Fetches all public user profiles.
	 *
	 * @returns A Result containing an array of PublicUserEntity records,
	 *          or a RepositoryError on database failure
	 */
	async execute(): Promise<Result<PublicUserEntity[], RepositoryError>> {
		const result = await this.userRepository.findAll();
		if (!result.success) {
			this.logger.error('Failed to list users', result.error);
		}
		return result;
	}
}
