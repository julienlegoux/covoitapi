/**
 * @module ListColorsUseCase
 *
 * Retrieves a paginated list of all car colors available on the platform.
 */

import { inject, injectable } from 'tsyringe';
import type { ColorEntity } from '../../../domain/entities/color.entity.js';
import type { ColorRepository } from '../../../domain/repositories/color.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok } from '../../../lib/shared/types/result.js';
import { type PaginationParams, type PaginatedResult, toSkipTake, buildPaginationMeta } from '../../../lib/shared/utils/pagination.util.js';

/**
 * Returns a paginated list of colors with metadata.
 *
 * Defaults to page 1 with a limit of 20 when no pagination parameters
 * are provided.
 *
 * @dependencies ColorRepository
 */
@injectable()
export class ListColorsUseCase {
	private readonly logger: Logger;

	constructor(
		@inject(TOKENS.ColorRepository)
		private readonly colorRepository: ColorRepository,
		@inject(TOKENS.Logger) logger: Logger,
	) {
		this.logger = logger.child({ useCase: 'ListColorsUseCase' });
	}

	/**
	 * Fetches a paginated page of colors.
	 *
	 * @param pagination - Optional page and limit parameters (defaults to page 1, limit 20)
	 * @returns A Result containing a PaginatedResult with color data and pagination meta,
	 *          or a RepositoryError on database failure
	 */
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
