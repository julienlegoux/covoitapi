/**
 * @module CreateCityUseCase
 *
 * Creates a new city record used as departure or arrival point for carpooling
 * travels. Cities are identified by name and zip code.
 */

import { inject, injectable } from 'tsyringe';
import type { CityEntity } from '../../../domain/entities/city.entity.js';
import type { CityRepository } from '../../../domain/repositories/city.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import type { CreateCitySchemaType } from '../../schemas/city.schema.js';

/**
 * Persists a new city record.
 *
 * Straightforward passthrough to the repository since city creation
 * has no additional business rules beyond schema validation.
 *
 * @dependencies CityRepository
 */
@injectable()
export class CreateCityUseCase {
	private readonly logger: Logger;

	constructor(
		@inject(TOKENS.CityRepository)
		private readonly cityRepository: CityRepository,
		@inject(TOKENS.Logger) logger: Logger,
	) {
		this.logger = logger.child({ useCase: 'CreateCityUseCase' });
	}

	/**
	 * Creates a new city with the given name and zip code.
	 *
	 * @param input - Validated payload containing cityName and zipcode
	 * @returns A Result containing the created CityEntity on success,
	 *          or a RepositoryError on database failure
	 */
	async execute(input: CreateCitySchemaType): Promise<Result<CityEntity, RepositoryError>> {
		const result = await this.cityRepository.create({
			cityName: input.cityName,
			zipcode: input.zipcode,
		});
		if (result.success) {
			this.logger.info('City created', { cityId: result.value.id });
		}
		return result;
	}
}
