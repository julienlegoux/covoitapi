/**
 * @module ListCarsUseCase
 *
 * Retrieves a paginated list of all cars registered on the carpooling platform.
 */

import { inject, injectable } from 'tsyringe';
import type { CarEntity } from '../../../domain/entities/car.entity.js';
import type { CarRepository } from '../../../domain/repositories/car.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok } from '../../../lib/shared/types/result.js';
import { type PaginationParams, type PaginatedResult, toSkipTake, buildPaginationMeta } from '../../../lib/shared/utils/pagination.util.js';

/**
 * Returns a paginated list of cars with metadata.
 *
 * Defaults to page 1 with a limit of 20 when no pagination parameters
 * are provided. Converts page/limit into skip/take for the repository layer.
 *
 * @dependencies CarRepository
 */
@injectable()
export class ListCarsUseCase {
	private readonly logger: Logger;

	constructor(
		@inject(TOKENS.CarRepository)
		private readonly carRepository: CarRepository,
		@inject(TOKENS.Logger) logger: Logger,
	) {
		this.logger = logger.child({ useCase: 'ListCarsUseCase' });
	}

	/**
	 * Fetches a paginated page of cars.
	 *
	 * @param pagination - Optional page and limit parameters (defaults to page 1, limit 20)
	 * @returns A Result containing a PaginatedResult with car data and pagination meta,
	 *          or a RepositoryError on database failure
	 */
	async execute(pagination?: PaginationParams): Promise<Result<PaginatedResult<CarEntity>, RepositoryError>> {
		const result = await this.carRepository.findAll(pagination ? toSkipTake(pagination) : undefined);
		if (!result.success) {
			this.logger.error('Failed to list cars', result.error);
			return result;
		}
		const { data, total } = result.value;
		this.logger.info('Listed cars', { count: data.length, total });
		return ok({
			data,
			meta: buildPaginationMeta(pagination ?? { page: 1, limit: 20 }, total),
		});
	}
}
