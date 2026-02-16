/**
 * @module ListCitiesUseCase
 *
 * Retrieves a paginated list of all cities available as departure or arrival
 * points on the carpooling platform.
 */

import { inject, injectable } from 'tsyringe';
import type { CityEntity } from '../../../domain/entities/city.entity.js';
import type { CityRepository } from '../../../domain/repositories/city.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok } from '../../../lib/shared/types/result.js';
import { type PaginationParams, type PaginatedResult, toSkipTake, buildPaginationMeta } from '../../../lib/shared/utils/pagination.util.js';

/**
 * Returns a paginated list of cities with metadata.
 *
 * Defaults to page 1 with a limit of 20 when no pagination parameters
 * are provided. Converts page/limit into skip/take for the repository layer.
 *
 * @dependencies CityRepository
 */
@injectable()
export class ListCitiesUseCase {
	private readonly logger: Logger;

	constructor(
		@inject(TOKENS.CityRepository)
		private readonly cityRepository: CityRepository,
		@inject(TOKENS.Logger) logger: Logger,
	) {
		this.logger = logger.child({ useCase: 'ListCitiesUseCase' });
	}

	/**
	 * Fetches a paginated page of cities.
	 *
	 * @param pagination - Optional page and limit parameters (defaults to page 1, limit 20)
	 * @returns A Result containing a PaginatedResult with city data and pagination meta,
	 *          or a RepositoryError on database failure
	 */
	async execute(pagination?: PaginationParams): Promise<Result<PaginatedResult<CityEntity>, RepositoryError>> {
		const result = await this.cityRepository.findAll(pagination ? toSkipTake(pagination) : undefined);
		if (!result.success) {
			this.logger.error('Failed to list cities', result.error);
			return result;
		}
		const { data, total } = result.value;
		this.logger.info('Listed cities', { count: data.length, total });
		return ok({
			data,
			meta: buildPaginationMeta(pagination ?? { page: 1, limit: 20 }, total),
		});
	}
}
