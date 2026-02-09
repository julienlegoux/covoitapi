import { inject, injectable } from 'tsyringe';
import type { CarEntity, UpdateCarData } from '../../../domain/entities/car.entity.js';
import { CarNotFoundError, BrandNotFoundError } from '../../../lib/errors/domain.errors.js';
import type { CarRepository } from '../../../domain/repositories/car.repository.js';
import type { ModelRepository } from '../../../domain/repositories/model.repository.js';
import type { BrandRepository } from '../../../domain/repositories/brand.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';
import type { UpdateCarInput } from '../../dtos/car.dto.js';

type UpdateCarError = CarNotFoundError | BrandNotFoundError | RepositoryError;

@injectable()
export class UpdateCarUseCase {
	constructor(
		@inject(TOKENS.CarRepository)
		private readonly carRepository: CarRepository,
		@inject(TOKENS.ModelRepository)
		private readonly modelRepository: ModelRepository,
		@inject(TOKENS.BrandRepository)
		private readonly brandRepository: BrandRepository,
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
			const modelRefIdResult = await this.resolveModelRefId(input.modele, input.marqueId);
			if (!modelRefIdResult.success) {
				return modelRefIdResult;
			}
			updateData.modelRefId = modelRefIdResult.value;
		}

		return this.carRepository.update(id, updateData);
	}

	private async resolveModelRefId(name: string, brandId: string): Promise<Result<number, BrandNotFoundError | RepositoryError>> {
		const brandResult = await this.brandRepository.findById(brandId);
		if (!brandResult.success) {
			return brandResult;
		}
		if (!brandResult.value) {
			return err(new BrandNotFoundError(brandId));
		}

		const modelResult = await this.modelRepository.findByNameAndBrand(name, brandResult.value.refId);
		if (!modelResult.success) {
			return modelResult;
		}

		if (modelResult.value) {
			return { success: true, value: modelResult.value.refId };
		}

		const createResult = await this.modelRepository.create({ name, brandRefId: brandResult.value.refId });
		if (!createResult.success) {
			return createResult;
		}

		return { success: true, value: createResult.value.refId };
	}
}
