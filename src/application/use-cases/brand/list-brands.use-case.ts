import { inject, injectable } from 'tsyringe';
import type { BrandEntity } from '../../../domain/entities/brand.entity.js';
import type { BrandRepository } from '../../../domain/repositories/brand.repository.js';
import type { RepositoryError } from '../../../infrastructure/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';

@injectable()
export class ListBrandsUseCase {
	constructor(
		@inject(TOKENS.BrandRepository)
		private readonly brandRepository: BrandRepository,
	) {}

	async execute(): Promise<Result<BrandEntity[], RepositoryError>> {
		return this.brandRepository.findAll();
	}
}
