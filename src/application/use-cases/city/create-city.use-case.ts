import { inject, injectable } from 'tsyringe';
import type { CityEntity } from '../../../domain/entities/city.entity.js';
import type { CityRepository } from '../../../domain/repositories/city.repository.js';
import type { RepositoryError } from '../../../infrastructure/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import type { CreateCityInput } from '../../dtos/city.dto.js';

@injectable()
export class CreateCityUseCase {
	constructor(
		@inject(TOKENS.CityRepository)
		private readonly cityRepository: CityRepository,
	) {}

	async execute(input: CreateCityInput): Promise<Result<CityEntity, RepositoryError>> {
		return this.cityRepository.create({
			cityName: input.cityName,
			zipcode: input.zipcode,
		});
	}
}
