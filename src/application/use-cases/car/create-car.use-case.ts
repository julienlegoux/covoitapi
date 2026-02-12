/**
 * @module CreateCarUseCase
 *
 * Registers a new car on the carpooling platform. Cars are identified by
 * license plate and linked to a model, which itself belongs to a brand.
 * If the model does not yet exist for the given brand, it is created on the fly.
 * The car is owned by the authenticated driver.
 */

import { inject, injectable } from 'tsyringe';
import type { CarEntity } from '../../../domain/entities/car.entity.js';
import { CarAlreadyExistsError, BrandNotFoundError, DriverNotFoundError } from '../../../lib/errors/domain.errors.js';
import type { CarRepository } from '../../../domain/repositories/car.repository.js';
import type { ModelRepository } from '../../../domain/repositories/model.repository.js';
import type { BrandRepository } from '../../../domain/repositories/brand.repository.js';
import type { UserRepository } from '../../../domain/repositories/user.repository.js';
import type { DriverRepository } from '../../../domain/repositories/driver.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';
import type { CreateCarSchemaType } from '../../schemas/car.schema.js';
import type { WithAuthContext } from '../../../lib/shared/types/auth-context.js';

/**
 * Union of all possible error types returned by the create car use case.
 *
 * - {@link CarAlreadyExistsError} - A car with the same license plate already exists
 * - {@link BrandNotFoundError} - The referenced brand UUID does not exist
 * - {@link DriverNotFoundError} - The authenticated user has no driver profile
 * - {@link RepositoryError} - Database-level failure during any step
 */
type CreateCarError = CarAlreadyExistsError | BrandNotFoundError | DriverNotFoundError | RepositoryError;

/**
 * Creates a new car record linked to a brand, model, and the authenticated driver.
 *
 * Business flow:
 * 1. Resolve the user UUID to find the associated driver profile
 * 2. Check that the license plate is not already registered
 * 3. Resolve the brand UUID to its internal refId
 * 4. Find or create the model by name + brand refId
 * 5. Persist the car with the license plate, resolved model refId, and driver refId
 *
 * @dependencies CarRepository, ModelRepository, BrandRepository, UserRepository, DriverRepository
 */
@injectable()
export class CreateCarUseCase {
	private readonly logger: Logger;

	constructor(
		@inject(TOKENS.CarRepository)
		private readonly carRepository: CarRepository,
		@inject(TOKENS.ModelRepository)
		private readonly modelRepository: ModelRepository,
		@inject(TOKENS.BrandRepository)
		private readonly brandRepository: BrandRepository,
		@inject(TOKENS.UserRepository)
		private readonly userRepository: UserRepository,
		@inject(TOKENS.DriverRepository)
		private readonly driverRepository: DriverRepository,
		@inject(TOKENS.Logger) logger: Logger,
	) {
		this.logger = logger.child({ useCase: 'CreateCarUseCase' });
	}

	/**
	 * Creates a new car with the given license plate, brand, and model.
	 *
	 * @param input - Validated payload containing licensePlate, brandId (UUID), model name, and authenticated userId
	 * @returns A Result containing the created CarEntity on success, or a CreateCarError on failure
	 */
	async execute(input: WithAuthContext<CreateCarSchemaType>): Promise<Result<CarEntity, CreateCarError>> {
		// Resolve user UUID to driver
		const userResult = await this.userRepository.findById(input.userId);
		if (!userResult.success) {
			return userResult;
		}
		if (!userResult.value) {
			this.logger.warn('Driver not found for car creation', { userId: input.userId });
			return err(new DriverNotFoundError(input.userId));
		}

		const driverResult = await this.driverRepository.findByUserRefId(userResult.value.refId);
		if (!driverResult.success) {
			return driverResult;
		}
		if (!driverResult.value) {
			this.logger.warn('Driver not found for car creation', { userId: input.userId });
			return err(new DriverNotFoundError(input.userId));
		}

		const existsResult = await this.carRepository.existsByLicensePlate(input.licensePlate);
		if (!existsResult.success) {
			return existsResult;
		}

		if (existsResult.value) {
			this.logger.warn('Car already exists', { licensePlate: input.licensePlate });
			return err(new CarAlreadyExistsError(input.licensePlate));
		}

		// Resolve brand UUID to refId
		const brandResult = await this.brandRepository.findById(input.brandId);
		if (!brandResult.success) {
			return brandResult;
		}
		if (!brandResult.value) {
			this.logger.warn('Brand not found', { brandId: input.brandId });
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

		const result = await this.carRepository.create({
			licensePlate: input.licensePlate,
			modelRefId,
			driverRefId: driverResult.value.refId,
		});
		if (result.success) {
			this.logger.info('Car created', { carId: result.value.id });
		}
		return result;
	}
}
