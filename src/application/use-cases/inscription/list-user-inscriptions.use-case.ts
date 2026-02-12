/**
 * @module ListUserInscriptionsUseCase
 *
 * Lists all travel inscriptions for a specific user. Resolves the user UUID
 * to its internal refId before querying inscriptions. Pagination is applied
 * in-memory after fetching all inscriptions for the user.
 */

import { inject, injectable } from 'tsyringe';
import type { InscriptionEntity } from '../../../domain/entities/inscription.entity.js';
import { UserNotFoundError } from '../../../lib/errors/domain.errors.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import type { InscriptionRepository } from '../../../domain/repositories/inscription.repository.js';
import type { UserRepository } from '../../../domain/repositories/user.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { type PaginationParams, type PaginatedResult, buildPaginationMeta } from '../../../lib/shared/utils/pagination.util.js';

/**
 * Union of all possible error types returned by the list user inscriptions use case.
 *
 * - {@link UserNotFoundError} - The user UUID does not exist
 * - {@link RepositoryError} - Database-level failure during lookup or listing
 */
type ListUserInscriptionsError = UserNotFoundError | RepositoryError;

/**
 * Retrieves all inscriptions belonging to a specific user, with pagination.
 *
 * Business flow:
 * 1. Resolve the user UUID to its internal refId
 * 2. Fetch all inscriptions for that user refId
 * 3. Apply in-memory pagination (slice) and build pagination metadata
 *
 * @dependencies InscriptionRepository, UserRepository
 */
@injectable()
export class ListUserInscriptionsUseCase {
	private readonly logger: Logger;

	constructor(
		@inject(TOKENS.InscriptionRepository)
		private readonly inscriptionRepository: InscriptionRepository,
		@inject(TOKENS.UserRepository)
		private readonly userRepository: UserRepository,
		@inject(TOKENS.Logger) logger: Logger,
	) {
		this.logger = logger.child({ useCase: 'ListUserInscriptionsUseCase' });
	}

	/**
	 * Fetches a paginated list of inscriptions for the given user.
	 *
	 * @param userId - The UUID of the user whose inscriptions to list
	 * @param pagination - Optional page and limit parameters (defaults to page 1, limit 20)
	 * @returns A Result containing a PaginatedResult with inscription data and pagination meta,
	 *          or a ListUserInscriptionsError on failure
	 */
	async execute(userId: string, pagination?: PaginationParams): Promise<Result<PaginatedResult<InscriptionEntity>, ListUserInscriptionsError>> {
		// Resolve userId UUID to refId
		const userResult = await this.userRepository.findById(userId);
		if (!userResult.success) return userResult;
		if (!userResult.value) return err(new UserNotFoundError(userId));

		const result = await this.inscriptionRepository.findByUserRefId(userResult.value.refId);
		if (!result.success) return result;
		const all = result.value;
		const params = pagination ?? { page: 1, limit: 20 };
		const start = (params.page - 1) * params.limit;
		const data = all.slice(start, start + params.limit);
		return ok({
			data,
			meta: buildPaginationMeta(params, all.length),
		});
	}
}
