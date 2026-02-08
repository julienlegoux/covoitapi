import { inject, injectable } from 'tsyringe';
import type { CarEntity } from '../../../domain/entities/car.entity.js';
import { CarAlreadyExistsError } from '../../../lib/errors/domain.errors.js';
import type { CarRepository } from '../../../domain/repositories/car.repository.js';
import type { ModelRepository } from '../../../domain/repositories/model.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';
import type { CreateCarInput } from '../../dtos/car.dto.js';

type CreateCarError = CarAlreadyExistsError | RepositoryError;

@injectable()
export class CreateCarUseCase {
	constructor(
		@inject(TOKENS.CarRepository)
		private readonly carRepository: CarRepository,
		@inject(TOKENS.ModelRepository)
		private readonly modelRepository: ModelRepository,
	) {}

	async execute(input: CreateCarInput): Promise<Result<CarEntity, CreateCarError>> {
		const existsResult = await this.carRepository.existsByImmat(input.immatriculation);
		if (!existsResult.success) {
			return existsResult;
		}

		if (existsResult.value) {
			return err(new CarAlreadyExistsError(input.immatriculation));
		}

		// Find or create model
		const modelResult = await this.modelRepository.findByNameAndBrand(input.modele, input.marqueId);
		if (!modelResult.success) {
			return modelResult;
		}

		let modelId: string;
		if (modelResult.value) {
			modelId = modelResult.value.id;
		} else {
			const createModelResult = await this.modelRepository.create({
				name: input.modele,
				brandId: input.marqueId,
			});
			if (!createModelResult.success) {
				return createModelResult;
			}
			modelId = createModelResult.value.id;
		}

		return this.carRepository.create({
			immat: input.immatriculation,
			modelId,
		});
	}
}
