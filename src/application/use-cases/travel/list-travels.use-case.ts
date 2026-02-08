import { inject, injectable } from 'tsyringe';
import type { TravelEntity } from '../../../domain/entities/travel.entity.js';
import type { TravelRepository } from '../../../domain/repositories/travel.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok } from '../../../lib/shared/types/result.js';
import { type PaginationParams, type PaginatedResult, toSkipTake, buildPaginationMeta } from '../../../lib/shared/utils/pagination.util.js';

@injectable()
export class ListTravelsUseCase {
	constructor(
		@inject(TOKENS.TravelRepository)
		private readonly travelRepository: TravelRepository,
	) {}

	async execute(pagination?: PaginationParams): Promise<Result<PaginatedResult<TravelEntity>, RepositoryError>> {
		const result = await this.travelRepository.findAll(pagination ? toSkipTake(pagination) : undefined);
		if (!result.success) return result;
		const { data, total } = result.value;
		return ok({
			data,
			meta: buildPaginationMeta(pagination ?? { page: 1, limit: 20 }, total),
		});
	}
}
