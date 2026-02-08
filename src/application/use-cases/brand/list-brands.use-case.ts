import { inject, injectable } from 'tsyringe';
import type { BrandEntity } from '../../../domain/entities/brand.entity.js';
import type { BrandRepository } from '../../../domain/repositories/brand.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok } from '../../../lib/shared/types/result.js';
import { type PaginationParams, type PaginatedResult, toSkipTake, buildPaginationMeta } from '../../../lib/shared/utils/pagination.util.js';

@injectable()
export class ListBrandsUseCase {
	constructor(
		@inject(TOKENS.BrandRepository)
		private readonly brandRepository: BrandRepository,
	) {}

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
