/**
 * @module UpdateCarUseCase
 *
 * Partially updates an existing car's information (license plate and/or model).
 * Verifies ownership before allowing the update. When the model is changed,
 * the brand UUID is resolved and the model is looked up or created on the fly,
 * following the same find-or-create pattern as car creation.
 */

import { inject, injectable } from 'tsyringe';
import type { CarEntity, UpdateCarData } from '../../../domain/entities/car.entity.js';
import { CarNotFoundError, BrandNotFoundError, DriverNotFoundError, ForbiddenError } from '../../../lib/errors/domain.errors.js';
import type { CarRepository } from '../../../domain/repositories/car.repository.js';
import type { ModelRepository } from '../../../domain/repositories/model.repository.js';
import type { BrandRepository } from '../../../domain/repositories/brand.repository.js';
import type { DriverRepository } from '../../../domain/repositories/driver.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';
import type { PatchCarSchemaType } from '../../schemas/car.schema.js';

/**
 * Union of all possible error types returned by the update car use case.
 *
 * - {@link CarNotFoundError} - No car exists with the given UUID
 * - {@link BrandNotFoundError} - The referenced brand UUID does not exist (when updating model)
 * - {@link DriverNotFoundError} - The authenticated user has no driver profile
 * - {@link ForbiddenError} - The car does not belong to the requesting driver
 * - {@link RepositoryError} - Database-level failure during any step
 */
type UpdateCarError = CarNotFoundError | BrandNotFoundError | DriverNotFoundError | ForbiddenError | RepositoryError;

/**
 * Partially updates a car's license plate and/or model after verifying ownership.
 *
 * Business flow:
 * 1. Verify the car exists by UUID
 * 2. Resolve the authenticated user to their driver profile
 * 3. Verify the car belongs to the requesting driver
 * 4. Build a partial update payload from the provided fields
 * 5. If model + brandId are provided, resolve the brand UUID to refId,
 *    then find or create the model to get its refId
 * 6. Persist the update
 *
 * @dependencies CarRepository, ModelRepository, BrandRepository, DriverRepository
 */
@injectable()
export class UpdateCarUseCase {
	private readonly logger: Logger;

	constructor(
		@inject(TOKENS.CarRepository)
		private readonly carRepository: CarRepository,
		@inject(TOKENS.ModelRepository)
		private readonly modelRepository: ModelRepository,
		@inject(TOKENS.BrandRepository)
		private readonly brandRepository: BrandRepository,
		@inject(TOKENS.DriverRepository)
		private readonly driverRepository: DriverRepository,
		@inject(TOKENS.Logger) logger: Logger,
	) {
		this.logger = logger.child({ useCase: 'UpdateCarUseCase' });
	}

	/**
	 * Applies a partial update to the car identified by UUID, after verifying ownership.
	 *
	 * @param id - The UUID of the car to update
	 * @param input - Validated patch payload with optional licensePlate, model, and brandId
	 * @param userId - The authenticated user's UUID for ownership verification
	 * @returns A Result containing the updated CarEntity on success, or an UpdateCarError on failure
	 */
	async execute(id: string, input: PatchCarSchemaType, userId: string): Promise<Result<CarEntity, UpdateCarError>> {
		const findResult = await this.carRepository.findById(id);
		if (!findResult.success) {
			return findResult;
		}
		if (!findResult.value) {
			this.logger.warn('Car not found for update', { carId: id });
			return err(new CarNotFoundError(id));
		}

		const ownershipResult = await this.verifyOwnership(findResult.value.driverRefId, userId, id);
		if (ownershipResult) {
			return ownershipResult;
		}

		const updateData = await this.buildUpdateData(input);
		if (!updateData.success) {
			return updateData;
		}

		const result = await this.carRepository.update(id, updateData.value);
		if (result.success) {
			this.logger.info('Car updated', { carId: id });
		}
		return result;
	}

	private async verifyOwnership(carDriverRefId: number, userId: string, carId: string): Promise<Result<never, UpdateCarError> | null> {
		const driverResult = await this.driverRepository.findByUserId(userId);
		if (!driverResult.success) {
			return driverResult;
		}
		if (!driverResult.value) {
			return err(new DriverNotFoundError(userId));
		}
		if (carDriverRefId !== driverResult.value.refId) {
			this.logger.warn('Ownership check failed for car update', { carId, userId });
			return err(new ForbiddenError('Car', carId));
		}
		return null;
	}

	private async buildUpdateData(input: PatchCarSchemaType): Promise<Result<UpdateCarData, BrandNotFoundError | RepositoryError>> {
		const updateData: UpdateCarData = {};
		if (input.licensePlate) {
			updateData.licensePlate = input.licensePlate;
		}
		if (input.model && input.brandId) {
			const modelRefIdResult = await this.resolveModelRefId(input.model, input.brandId);
			if (!modelRefIdResult.success) {
				return modelRefIdResult;
			}
			updateData.modelRefId = modelRefIdResult.value;
		}
		return { success: true, value: updateData };
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
