/**
 * @module ListInscriptionsUseCase
 *
 * Retrieves a paginated list of all inscriptions across the platform.
 * Primarily used for administrative purposes.
 */

import { inject, injectable } from 'tsyringe';
import type { InscriptionEntity } from '../../../domain/entities/inscription.entity.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import type { InscriptionRepository } from '../../../domain/repositories/inscription.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok } from '../../../lib/shared/types/result.js';
import { type PaginationParams, type PaginatedResult, toSkipTake, buildPaginationMeta } from '../../../lib/shared/utils/pagination.util.js';

/**
 * Returns a paginated list of all inscriptions with metadata.
 *
 * @dependencies InscriptionRepository
 */
@injectable()
export class ListInscriptionsUseCase {
	private readonly logger: Logger;

	constructor(
		@inject(TOKENS.InscriptionRepository)
		private readonly inscriptionRepository: InscriptionRepository,
		@inject(TOKENS.Logger) logger: Logger,
	) {
		this.logger = logger.child({ useCase: 'ListInscriptionsUseCase' });
	}

	/**
	 * Fetches a paginated page of inscriptions.
	 *
	 * @param pagination - Optional page and limit parameters (defaults to page 1, limit 20)
	 * @returns A Result containing a PaginatedResult with inscription data and pagination meta,
	 *          or a RepositoryError on database failure
	 */
	async execute(pagination?: PaginationParams): Promise<Result<PaginatedResult<InscriptionEntity>, RepositoryError>> {
		const result = await this.inscriptionRepository.findAll(pagination ? toSkipTake(pagination) : undefined);
		if (!result.success) {
			this.logger.error('Failed to list inscriptions', { error: result.error });
			return result;
		}
		const { data, total } = result.value;
		this.logger.info('Listed inscriptions', { count: data.length, total });
		return ok({
			data,
			meta: buildPaginationMeta(pagination ?? { page: 1, limit: 20 }, total),
		});
	}
}
