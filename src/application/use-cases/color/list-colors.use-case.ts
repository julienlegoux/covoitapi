import { inject, injectable } from 'tsyringe';
import type { ColorEntity } from '../../../domain/entities/color.entity.js';
import type { ColorRepository } from '../../../domain/repositories/color.repository.js';
import type { RepositoryError } from '../../../infrastructure/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok } from '../../../lib/shared/types/result.js';
import { type PaginationParams, type PaginatedResult, toSkipTake, buildPaginationMeta } from '../../../lib/shared/utils/pagination.util.js';

@injectable()
export class ListColorsUseCase {
	constructor(
		@inject(TOKENS.ColorRepository)
		private readonly colorRepository: ColorRepository,
	) {}

	async execute(pagination?: PaginationParams): Promise<Result<PaginatedResult<ColorEntity>, RepositoryError>> {
		const result = await this.colorRepository.findAll(pagination ? toSkipTake(pagination) : undefined);
		if (!result.success) return result;
		const { data, total } = result.value;
		return ok({
			data,
			meta: buildPaginationMeta(pagination ?? { page: 1, limit: 20 }, total),
		});
	}
}
