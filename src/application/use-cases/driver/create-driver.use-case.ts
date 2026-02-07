import { inject, injectable } from 'tsyringe';
import type { DriverEntity } from '../../../domain/entities/driver.entity.js';
import { DriverAlreadyExistsError } from '../../../domain/errors/domain.errors.js';
import type { DriverRepository } from '../../../domain/repositories/driver.repository.js';
import type { RepositoryError } from '../../../infrastructure/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';
import type { CreateDriverInput } from '../../dtos/driver.dto.js';

type CreateDriverError = DriverAlreadyExistsError | RepositoryError;

@injectable()
export class CreateDriverUseCase {
	constructor(
		@inject(TOKENS.DriverRepository)
		private readonly driverRepository: DriverRepository,
	) {}

	async execute(input: CreateDriverInput): Promise<Result<DriverEntity, CreateDriverError>> {
		const existingResult = await this.driverRepository.findByUserId(input.userId);
		if (!existingResult.success) {
			return existingResult;
		}

		if (existingResult.value) {
			return err(new DriverAlreadyExistsError(input.userId));
		}

		return this.driverRepository.create({
			driverLicense: input.driverLicense,
			userId: input.userId,
		});
	}
}
