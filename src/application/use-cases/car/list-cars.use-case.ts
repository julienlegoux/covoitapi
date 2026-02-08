import { inject, injectable } from 'tsyringe';
import type { CarEntity } from '../../../domain/entities/car.entity.js';
import type { CarRepository } from '../../../domain/repositories/car.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok } from '../../../lib/shared/types/result.js';
import { type PaginationParams, type PaginatedResult, toSkipTake, buildPaginationMeta } from '../../../lib/shared/utils/pagination.util.js';

@injectable()
export class ListCarsUseCase {
	constructor(
		@inject(TOKENS.CarRepository)
		private readonly carRepository: CarRepository,
	) {}

	async execute(pagination?: PaginationParams): Promise<Result<PaginatedResult<CarEntity>, RepositoryError>> {
		const result = await this.carRepository.findAll(pagination ? toSkipTake(pagination) : undefined);
		if (!result.success) return result;
		const { data, total } = result.value;
		return ok({
			data,
			meta: buildPaginationMeta(pagination ?? { page: 1, limit: 20 }, total),
		});
	}
}
