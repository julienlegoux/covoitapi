/**
 * @module CreateBrandUseCase
 *
 * Creates a new car brand (e.g. Toyota, Renault) in the system.
 * Brands serve as a top-level reference for car models in the carpooling platform.
 */

import { inject, injectable } from 'tsyringe';
import type { BrandEntity } from '../../../domain/entities/brand.entity.js';
import type { BrandRepository } from '../../../domain/repositories/brand.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import type { CreateBrandSchemaType } from '../../schemas/brand.schema.js';

/**
 * Persists a new car brand record.
 *
 * This is a straightforward passthrough to the repository since brand creation
 * has no additional business rules beyond schema validation (handled upstream).
 *
 * @dependencies BrandRepository
 */
@injectable()
export class CreateBrandUseCase {
	private readonly logger: Logger;

	constructor(
		@inject(TOKENS.BrandRepository)
		private readonly brandRepository: BrandRepository,
		@inject(TOKENS.Logger) logger: Logger,
	) {
		this.logger = logger.child({ useCase: 'CreateBrandUseCase' });
	}

	/**
	 * Creates a new brand with the given name.
	 *
	 * @param input - Validated payload containing the brand name
	 * @returns A Result containing the created BrandEntity on success,
	 *          or a RepositoryError on database failure
	 */
	async execute(input: CreateBrandSchemaType): Promise<Result<BrandEntity, RepositoryError>> {
		const result = await this.brandRepository.create({ name: input.name });
		if (result.success) {
			this.logger.info('Brand created', { brandId: result.value.id });
		}
		return result;
	}
}
