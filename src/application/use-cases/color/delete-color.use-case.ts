import { inject, injectable } from 'tsyringe';
import { ColorNotFoundError } from '../../../domain/errors/domain.errors.js';
import type { ColorRepository } from '../../../domain/repositories/color.repository.js';
import type { RepositoryError } from '../../../infrastructure/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';

type DeleteColorError = ColorNotFoundError | RepositoryError;

@injectable()
export class DeleteColorUseCase {
	constructor(
		@inject(TOKENS.ColorRepository)
		private readonly colorRepository: ColorRepository,
	) {}

	async execute(id: string): Promise<Result<void, DeleteColorError>> {
		const findResult = await this.colorRepository.findById(id);
		if (!findResult.success) {
			return findResult;
		}

		if (!findResult.value) {
			return err(new ColorNotFoundError(id));
		}

		return this.colorRepository.delete(id);
	}
}
