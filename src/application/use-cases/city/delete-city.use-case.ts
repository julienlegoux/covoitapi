import { inject, injectable } from 'tsyringe';
import { CityNotFoundError } from '../../../domain/errors/domain.errors.js';
import type { CityRepository } from '../../../domain/repositories/city.repository.js';
import type { RepositoryError } from '../../../infrastructure/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';

type DeleteCityError = CityNotFoundError | RepositoryError;

@injectable()
export class DeleteCityUseCase {
	constructor(
		@inject(TOKENS.CityRepository)
		private readonly cityRepository: CityRepository,
	) {}

	async execute(id: string): Promise<Result<void, DeleteCityError>> {
		const findResult = await this.cityRepository.findById(id);
		if (!findResult.success) {
			return findResult;
		}

		if (!findResult.value) {
			return err(new CityNotFoundError(id));
		}

		return this.cityRepository.delete(id);
	}
}
