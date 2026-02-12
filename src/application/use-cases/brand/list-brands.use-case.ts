/**
 * @module ListBrandsUseCase
 *
 * Retrieves a paginated list of all car brands available on the platform.
 * Used by the car registration flow to let users pick a brand for their vehicle.
 */

import { inject, injectable } from 'tsyringe';
import type { BrandEntity } from '../../../domain/entities/brand.entity.js';
import type { BrandRepository } from '../../../domain/repositories/brand.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok } from '../../../lib/shared/types/result.js';
import { type PaginationParams, type PaginatedResult, toSkipTake, buildPaginationMeta } from '../../../lib/shared/utils/pagination.util.js';

/**
 * Returns a paginated list of car brands with metadata.
 *
 * Defaults to page 1 with a limit of 20 when no pagination parameters
 * are provided. Converts page/limit into skip/take for the repository layer
 * and builds standardized pagination metadata for the response.
 *
 * @dependencies BrandRepository
 */
@injectable()
export class ListBrandsUseCase {
	private readonly logger: Logger;

	constructor(
		@inject(TOKENS.BrandRepository)
		private readonly brandRepository: BrandRepository,
		@inject(TOKENS.Logger) logger: Logger,
	) {
		this.logger = logger.child({ useCase: 'ListBrandsUseCase' });
	}

	/**
	 * Fetches a paginated page of brands.
	 *
	 * @param pagination - Optional page and limit parameters (defaults to page 1, limit 20)
	 * @returns A Result containing a PaginatedResult with brand data and pagination meta,
	 *          or a RepositoryError on database failure
	 */
	async execute(pagination?: PaginationParams): Promise<Result<PaginatedResult<BrandEntity>, RepositoryError>> {
		const result = await this.brandRepository.findAll(pagination ? toSkipTake(pagination) : undefined);
		if (!result.success) return result;
		const { data, total } = result.value;
		return ok({
			data,
			meta: buildPaginationMeta(pagination ?? { page: 1, limit: 20 }, total),
		});
	}
}
