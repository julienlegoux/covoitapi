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
import type { CreateCarSchemaType } from '../../schemas/car.schema.js';

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

	async execute(input: CreateCarSchemaType): Promise<Result<CarEntity, CreateCarError>> {
		const existsResult = await this.carRepository.existsByLicensePlate(input.licensePlate);
		if (!existsResult.success) {
			return existsResult;
		}

		if (existsResult.value) {
			return err(new CarAlreadyExistsError(input.licensePlate));
		}

		// Resolve brand UUID to refId
		const brandResult = await this.brandRepository.findById(input.brandId);
		if (!brandResult.success) {
			return brandResult;
		}
		if (!brandResult.value) {
			return err(new BrandNotFoundError(input.brandId));
		}

		// Find or create model using brand refId
		const modelResult = await this.modelRepository.findByNameAndBrand(input.model, brandResult.value.refId);
		if (!modelResult.success) {
			return modelResult;
		}

		let modelRefId: number;
		if (modelResult.value) {
			modelRefId = modelResult.value.refId;
		} else {
			const createModelResult = await this.modelRepository.create({
				name: input.model,
				brandRefId: brandResult.value.refId,
			});
			if (!createModelResult.success) {
				return createModelResult;
			}
			modelRefId = createModelResult.value.refId;
		}

		return this.carRepository.create({
			licensePlate: input.licensePlate,
			modelRefId,
		});
	}
}
