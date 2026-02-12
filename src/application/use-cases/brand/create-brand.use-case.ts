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
	constructor(
		@inject(TOKENS.BrandRepository)
		private readonly brandRepository: BrandRepository,
	) {}

	/**
	 * Creates a new brand with the given name.
	 *
	 * @param input - Validated payload containing the brand name
	 * @returns A Result containing the created BrandEntity on success,
	 *          or a RepositoryError on database failure
	 */
	async execute(input: CreateBrandSchemaType): Promise<Result<BrandEntity, RepositoryError>> {
		return this.brandRepository.create({ name: input.name });
	}
}
