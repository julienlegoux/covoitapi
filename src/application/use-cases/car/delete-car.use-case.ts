import { inject, injectable } from 'tsyringe';
import { CarNotFoundError } from '../../../domain/errors/domain.errors.js';
import type { CarRepository } from '../../../domain/repositories/car.repository.js';
import type { RepositoryError } from '../../../infrastructure/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';

type DeleteCarError = CarNotFoundError | RepositoryError;

@injectable()
export class DeleteCarUseCase {
	constructor(
		@inject(TOKENS.CarRepository)
		private readonly carRepository: CarRepository,
	) {}

	async execute(id: string): Promise<Result<void, DeleteCarError>> {
		const findResult = await this.carRepository.findById(id);
		if (!findResult.success) {
			return findResult;
		}

		if (!findResult.value) {
			return err(new CarNotFoundError(id));
		}

		return this.carRepository.delete(id);
	}
}
