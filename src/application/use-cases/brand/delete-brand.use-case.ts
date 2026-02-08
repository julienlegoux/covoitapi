import { inject, injectable } from 'tsyringe';
import { BrandNotFoundError } from '../../../lib/errors/domain.errors.js';
import type { BrandRepository } from '../../../domain/repositories/brand.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';

type DeleteBrandError = BrandNotFoundError | RepositoryError;

@injectable()
export class DeleteBrandUseCase {
	constructor(
		@inject(TOKENS.BrandRepository)
		private readonly brandRepository: BrandRepository,
	) {}

	async execute(id: string): Promise<Result<void, DeleteBrandError>> {
		const findResult = await this.brandRepository.findById(id);
		if (!findResult.success) {
			return findResult;
		}

		if (!findResult.value) {
			return err(new BrandNotFoundError(id));
		}

		return this.brandRepository.delete(id);
	}
}
