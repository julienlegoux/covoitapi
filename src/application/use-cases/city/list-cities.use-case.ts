import { inject, injectable } from 'tsyringe';
import type { CityEntity } from '../../../domain/entities/city.entity.js';
import type { CityRepository } from '../../../domain/repositories/city.repository.js';
import type { RepositoryError } from '../../../infrastructure/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok } from '../../../lib/shared/types/result.js';
import { type PaginationParams, type PaginatedResult, toSkipTake, buildPaginationMeta } from '../../../lib/shared/utils/pagination.util.js';

@injectable()
export class ListCitiesUseCase {
	constructor(
		@inject(TOKENS.CityRepository)
		private readonly cityRepository: CityRepository,
	) {}

	async execute(pagination?: PaginationParams): Promise<Result<PaginatedResult<CityEntity>, RepositoryError>> {
		const result = await this.cityRepository.findAll(pagination ? toSkipTake(pagination) : undefined);
		if (!result.success) return result;
		const { data, total } = result.value;
		return ok({
			data,
			meta: buildPaginationMeta(pagination ?? { page: 1, limit: 20 }, total),
		});
	}
}
