/**
 * @module CreateCarUseCase
 *
 * Registers a new car on the carpooling platform. Cars are identified by
 * license plate and linked to a model, which itself belongs to a brand.
 * If the model does not yet exist for the given brand, it is created on the fly.
 */

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

/**
 * Union of all possible error types returned by the create car use case.
 *
 * - {@link CarAlreadyExistsError} - A car with the same license plate already exists
 * - {@link BrandNotFoundError} - The referenced brand UUID does not exist
 * - {@link RepositoryError} - Database-level failure during any step
 */
type CreateCarError = CarAlreadyExistsError | BrandNotFoundError | RepositoryError;

/**
 * Creates a new car record linked to a brand and model.
 *
 * Business flow:
 * 1. Check that the license plate is not already registered
 * 2. Resolve the brand UUID to its internal refId
 * 3. Find or create the model by name + brand refId
 * 4. Persist the car with the license plate and resolved model refId
 *
 * The UUID-to-refId resolution pattern is used because external APIs work
 * with UUIDs while internal foreign keys use auto-incremented integers.
 *
 * @dependencies CarRepository, ModelRepository, BrandRepository
 */
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

	/**
	 * Creates a new car with the given license plate, brand, and model.
	 *
	 * @param input - Validated payload containing licensePlate, brandId (UUID), and model name
	 * @returns A Result containing the created CarEntity on success, or a CreateCarError on failure
	 */
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
