import { inject, injectable } from 'tsyringe';
import type { ColorEntity } from '../../../domain/entities/color.entity.js';
import { ColorAlreadyExistsError } from '../../../lib/errors/domain.errors.js';
import type { ColorRepository } from '../../../domain/repositories/color.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';
import type { CreateColorSchemaType } from '../../schemas/color.schema.js';

type CreateColorError = ColorAlreadyExistsError | RepositoryError;

@injectable()
export class CreateColorUseCase {
	constructor(
		@inject(TOKENS.ColorRepository)
		private readonly colorRepository: ColorRepository,
	) {}

	async execute(input: CreateColorSchemaType): Promise<Result<ColorEntity, CreateColorError>> {
		const existingResult = await this.colorRepository.findByName(input.name);
		if (!existingResult.success) {
			return existingResult;
		}

		if (existingResult.value) {
			return err(new ColorAlreadyExistsError(input.name));
		}

		return this.colorRepository.create({ name: input.name, hex: input.hex });
	}
}
