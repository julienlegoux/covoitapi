import { inject, injectable } from 'tsyringe';
import type { ColorEntity } from '../../../domain/entities/color.entity.js';
import { ColorNotFoundError } from '../../../lib/errors/domain.errors.js';
import type { ColorRepository } from '../../../domain/repositories/color.repository.js';
import type { UpdateColorData } from '../../../domain/repositories/color.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';

type UpdateColorInput = { id: string; name?: string; hex?: string };
type UpdateColorError = ColorNotFoundError | RepositoryError;

@injectable()
export class UpdateColorUseCase {
	constructor(
		@inject(TOKENS.ColorRepository)
		private readonly colorRepository: ColorRepository,
	) {}

	async execute(input: UpdateColorInput): Promise<Result<ColorEntity, UpdateColorError>> {
		const findResult = await this.colorRepository.findById(input.id);
		if (!findResult.success) {
			return findResult;
		}

		if (!findResult.value) {
			return err(new ColorNotFoundError(input.id));
		}

		const updateData: UpdateColorData = {};
		if (input.name !== undefined) {
			updateData.name = input.name;
		}
		if (input.hex !== undefined) {
			updateData.hex = input.hex;
		}

		return this.colorRepository.update(input.id, updateData);
	}
}
