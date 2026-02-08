import { inject, injectable } from 'tsyringe';
import type { CarEntity } from '../../../domain/entities/car.entity.js';
import { CarAlreadyExistsError, BrandNotFoundError } from '../../../lib/errors/domain.errors.js';
import type { CarRepository } from '../../../domain/repositories/car.repository.js';
import type { ModelRepository } from '../../../domain/repositories/model.repository.js';
import type { BrandRepository } from '../../../domain/repositories/brand.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';
import type { CreateCarInput } from '../../dtos/car.dto.js';

type CreateCarError = CarAlreadyExistsError | BrandNotFoundError | RepositoryError;

@injectable()
export class CreateCarUseCase {
	constructor(
		@inject(TOKENS.CarRepository)
		private readonly carRepository: CarRepository,
		@inject(TOKENS.ModelRepository)
		private readonly modelRepository: ModelRepository,
		@inject(TOKENS.BrandRepository)
		private readonly brandRepository: BrandRepository,
	) {}

	async execute(input: CreateCarInput): Promise<Result<CarEntity, CreateCarError>> {
		const existsResult = await this.carRepository.existsByImmat(input.immatriculation);
		if (!existsResult.success) {
			return existsResult;
		}

		if (existsResult.value) {
			return err(new CarAlreadyExistsError(input.immatriculation));
		}

		// Resolve brand UUID to refId
		const brandResult = await this.brandRepository.findById(input.marqueId);
		if (!brandResult.success) {
			return brandResult;
		}
		if (!brandResult.value) {
			return err(new BrandNotFoundError(input.marqueId));
		}

		// Find or create model using brand refId
		const modelResult = await this.modelRepository.findByNameAndBrand(input.modele, brandResult.value.refId);
		if (!modelResult.success) {
			return modelResult;
		}

		let modelRefId: number;
		if (modelResult.value) {
			modelRefId = modelResult.value.refId;
		} else {
			const createModelResult = await this.modelRepository.create({
				name: input.modele,
				brandRefId: brandResult.value.refId,
			});
			if (!createModelResult.success) {
				return createModelResult;
			}
			modelRefId = createModelResult.value.refId;
		}

		return this.carRepository.create({
			immat: input.immatriculation,
			modelRefId,
		});
	}
}
