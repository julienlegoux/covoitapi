/**
 * @module UpdateColorUseCase
 *
 * Partially updates an existing color's name and/or hex code.
 * Verifies the color exists before applying the update.
 */

import { inject, injectable } from 'tsyringe';
import type { ColorEntity } from '../../../domain/entities/color.entity.js';
import { ColorNotFoundError } from '../../../lib/errors/domain.errors.js';
import type { ColorRepository } from '../../../domain/repositories/color.repository.js';
import type { UpdateColorData } from '../../../domain/repositories/color.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';
import type { UpdateColorSchemaType } from '../../schemas/color.schema.js';

/** Combined input type: UUID identifier plus optional update fields. */
type UpdateColorInput = { id: string } & UpdateColorSchemaType;

/**
 * Union of all possible error types returned by the update color use case.
 *
 * - {@link ColorNotFoundError} - No color exists with the given UUID
 * - {@link RepositoryError} - Database-level failure during lookup or update
 */
type UpdateColorError = ColorNotFoundError | RepositoryError;

/**
 * Partially updates a color's name and/or hex code.
 *
 * Business flow:
 * 1. Verify the color exists by UUID
 * 2. Build a partial update payload from the provided fields
 * 3. Persist the update
 *
 * @dependencies ColorRepository
 */
@injectable()
export class UpdateColorUseCase {
	private readonly logger: Logger;

	constructor(
		@inject(TOKENS.ColorRepository)
		private readonly colorRepository: ColorRepository,
		@inject(TOKENS.Logger) logger: Logger,
	) {
		this.logger = logger.child({ useCase: 'UpdateColorUseCase' });
	}

	/**
	 * Applies a partial update to the color identified by UUID.
	 *
	 * @param input - Object containing the color UUID and optional name/hex fields to update
	 * @returns A Result containing the updated ColorEntity on success,
	 *          or an UpdateColorError on failure
	 */
	async execute(input: UpdateColorInput): Promise<Result<ColorEntity, UpdateColorError>> {
		const findResult = await this.colorRepository.findById(input.id);
		if (!findResult.success) {
			return findResult;
		}

		if (!findResult.value) {
			this.logger.warn('Color not found for update', { colorId: input.id });
			return err(new ColorNotFoundError(input.id));
		}

		const updateData: UpdateColorData = {};
		if (input.name !== undefined) {
			updateData.name = input.name;
		}
		if (input.hex !== undefined) {
			updateData.hex = input.hex;
		}

		const result = await this.colorRepository.update(input.id, updateData);
		if (result.success) {
			this.logger.info('Color updated', { colorId: input.id });
		}
		return result;
	}
}
