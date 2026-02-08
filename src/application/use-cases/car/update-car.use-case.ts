import { inject, injectable } from 'tsyringe';
import type { CarEntity, UpdateCarData } from '../../../domain/entities/car.entity.js';
import { CarNotFoundError } from '../../../lib/errors/domain.errors.js';
import type { CarRepository } from '../../../domain/repositories/car.repository.js';
import type { ModelRepository } from '../../../domain/repositories/model.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';
import type { UpdateCarInput } from '../../dtos/car.dto.js';

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
			const modelIdResult = await this.resolveModelId(input.modele, input.marqueId);
			if (!modelIdResult.success) {
				return modelIdResult;
			}
			updateData.modelId = modelIdResult.value;
		}

		return this.carRepository.update(id, updateData);
	}

	private async resolveModelId(name: string, brandId: string): Promise<Result<string, RepositoryError>> {
		const modelResult = await this.modelRepository.findByNameAndBrand(name, brandId);
		if (!modelResult.success) {
			return modelResult;
		}

		if (modelResult.value) {
			return { success: true, value: modelResult.value.id };
		}

		const createResult = await this.modelRepository.create({ name, brandId });
		if (!createResult.success) {
			return createResult;
		}

		return { success: true, value: createResult.value.id };
	}
}
