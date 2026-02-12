/**
 * @module CreateColorUseCase
 *
 * Creates a new car color option (e.g. Red, Blue) with a name and hex code.
 * Colors are used to describe vehicles on the carpooling platform.
 * Enforces uniqueness on the color name.
 */

import { inject, injectable } from 'tsyringe';
import type { ColorEntity } from '../../../domain/entities/color.entity.js';
import { ColorAlreadyExistsError } from '../../../lib/errors/domain.errors.js';
import type { ColorRepository } from '../../../domain/repositories/color.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';
import type { CreateColorSchemaType } from '../../schemas/color.schema.js';

/**
 * Union of all possible error types returned by the create color use case.
 *
 * - {@link ColorAlreadyExistsError} - A color with the same name already exists
 * - {@link RepositoryError} - Database-level failure during lookup or creation
 */
type CreateColorError = ColorAlreadyExistsError | RepositoryError;

/**
 * Creates a new color after verifying the name is unique.
 *
 * Business flow:
 * 1. Check if a color with the same name already exists
 * 2. If so, return ColorAlreadyExistsError
 * 3. Persist the new color record
 *
 * @dependencies ColorRepository
 */
@injectable()
export class CreateColorUseCase {
	constructor(
		@inject(TOKENS.ColorRepository)
		private readonly colorRepository: ColorRepository,
	) {}

	/**
	 * Creates a new color with the given name and hex code.
	 *
	 * @param input - Validated payload containing color name and hex value
	 * @returns A Result containing the created ColorEntity on success,
	 *          or a CreateColorError on failure
	 */
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
