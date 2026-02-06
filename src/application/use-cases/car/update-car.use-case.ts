import { inject, injectable } from 'tsyringe';
import type { CarEntity } from '../../../domain/entities/car.entity.js';
import { CarNotFoundError } from '../../../domain/errors/domain.errors.js';
import type { CarRepository } from '../../../domain/repositories/car.repository.js';
import type { ModelRepository } from '../../../domain/repositories/model.repository.js';
import type { RepositoryError } from '../../../infrastructure/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';
import type { UpdateCarInput } from '../../dtos/car.dto.js';
import type { UpdateCarData } from '../../../domain/entities/car.entity.js';

type UpdateCarError = CarNotFoundError | RepositoryError;

@injectable()
export class UpdateCarUseCase {
	constructor(
		@inject(TOKENS.CarRepository)
		private readonly carRepository: CarRepository,
		@inject(TOKENS.ModelRepository)
		private readonly modelRepository: ModelRepository,
	) {}

	async execute(id: string, input: UpdateCarInput): Promise<Result<CarEntity, UpdateCarError>> {
		const findResult = await this.carRepository.findById(id);
		if (!findResult.success) {
			return findResult;
		}

		if (!findResult.value) {
			return err(new CarNotFoundError(id));
		}

		const updateData: UpdateCarData = {};

		if (input.immatriculation) {
			updateData.immat = input.immatriculation;
		}

		if (input.modele && input.marqueId) {
			const modelResult = await this.modelRepository.findByNameAndBrand(input.modele, input.marqueId);
			if (!modelResult.success) {
				return modelResult;
			}

			if (modelResult.value) {
				updateData.modelId = modelResult.value.id;
			} else {
				const createModelResult = await this.modelRepository.create({
					name: input.modele,
					brandId: input.marqueId,
				});
				if (!createModelResult.success) {
					return createModelResult;
				}
				updateData.modelId = createModelResult.value.id;
			}
		}

		return this.carRepository.update(id, updateData);
	}
}
