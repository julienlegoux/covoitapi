/**
 * @module ListRoutePassengersUseCase
 *
 * Lists all passengers (inscriptions) for a specific carpooling travel.
 * Queries inscriptions directly by travel UUID via a relation filter.
 * Pagination is applied in-memory after fetching all inscriptions for the route.
 */

import { inject, injectable } from 'tsyringe';
import type { InscriptionEntity } from '../../../domain/entities/inscription.entity.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import type { InscriptionRepository } from '../../../domain/repositories/inscription.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok } from '../../../lib/shared/types/result.js';
import { type PaginationParams, type PaginatedResult, buildPaginationMeta } from '../../../lib/shared/utils/pagination.util.js';

/**
 * Retrieves all passengers inscribed on a specific travel, with pagination.
 *
 * Business flow:
 * 1. Fetch all inscriptions for the travel UUID via relation filter
 * 2. Apply in-memory pagination (slice) and build pagination metadata
 *
 * @dependencies InscriptionRepository
 */
@injectable()
export class ListRoutePassengersUseCase {
	private readonly logger: Logger;

	constructor(
		@inject(TOKENS.InscriptionRepository)
		private readonly inscriptionRepository: InscriptionRepository,
		@inject(TOKENS.Logger) logger: Logger,
	) {
		this.logger = logger.child({ useCase: 'ListRoutePassengersUseCase' });
	}

	/**
	 * Fetches a paginated list of passengers for the given travel.
	 *
	 * @param routeId - The UUID of the travel (route) to list passengers for
	 * @param pagination - Optional page and limit parameters (defaults to page 1, limit 20)
	 * @returns A Result containing a PaginatedResult with inscription data and pagination meta,
	 *          or a RepositoryError on failure
	 */
	async execute(routeId: string, pagination?: PaginationParams): Promise<Result<PaginatedResult<InscriptionEntity>, RepositoryError>> {
		const result = await this.inscriptionRepository.findByTravelId(routeId);
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
