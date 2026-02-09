import { inject, injectable } from 'tsyringe';
import type { BrandEntity } from '../../../domain/entities/brand.entity.js';
import type { BrandRepository } from '../../../domain/repositories/brand.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import type { CreateBrandInput } from '../../dtos/brand.dto.js';

@injectable()
export class CreateBrandUseCase {
	constructor(
		@inject(TOKENS.BrandRepository)
		private readonly brandRepository: BrandRepository,
	) {}

	async execute(input: CreateBrandInput): Promise<Result<BrandEntity, RepositoryError>> {
		return this.brandRepository.create({ name: input.name });
	}
}
