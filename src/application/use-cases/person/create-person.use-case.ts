import { inject, injectable } from 'tsyringe';
import type { UserEntity } from '../../../domain/entities/user.entity.js';
import { UserAlreadyExistsError } from '../../../domain/errors/domain.errors.js';
import type { UserRepository } from '../../../domain/repositories/user.repository.js';
import type { CityRepository } from '../../../domain/repositories/city.repository.js';
import type { CarRepository } from '../../../domain/repositories/car.repository.js';
import type { DriverRepository } from '../../../domain/repositories/driver.repository.js';
import type { PasswordService } from '../../../domain/services/password.service.js';
import type { RepositoryError } from '../../../infrastructure/errors/repository.errors.js';
import type { PasswordError } from '../../../infrastructure/errors/password.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import type { CreatePersonInput } from '../../dtos/person.dto.js';
import { logger } from '../../../infrastructure/logging/logger.js';

type CreatePersonError = UserAlreadyExistsError | RepositoryError | PasswordError;

@injectable()
export class CreatePersonUseCase {
	constructor(
		@inject(TOKENS.UserRepository)
		private readonly userRepository: UserRepository,
		@inject(TOKENS.PasswordService)
		private readonly passwordService: PasswordService,
		@inject(TOKENS.CityRepository)
		private readonly cityRepository: CityRepository,
		@inject(TOKENS.CarRepository)
		private readonly carRepository: CarRepository,
		@inject(TOKENS.DriverRepository)
		private readonly driverRepository: DriverRepository,
	) {}

	async execute(input: CreatePersonInput): Promise<Result<UserEntity, CreatePersonError>> {
		const existsResult = await this.userRepository.existsByEmail(input.email);
		if (!existsResult.success) {
			return existsResult;
		}

		if (existsResult.value) {
			return err(new UserAlreadyExistsError(input.email));
		}

		const hashResult = await this.passwordService.hash(input.password);
		if (!hashResult.success) {
			return hashResult;
		}

		const createResult = await this.userRepository.create({
			email: input.email,
			password: hashResult.value,
			firstName: input.firstName,
			lastName: input.lastName,
			phone: input.phone,
		});
		if (!createResult.success) {
			return createResult;
		}

		const user = createResult.value;

		// If ville is provided, find or create city
		if (input.ville) {
			const cityResult = await this.cityRepository.findByCityName(input.ville);
			if (!cityResult.success) {
				logger.warn('Failed to look up city', { ville: input.ville, errorCode: cityResult.error.code });
			}
		}

		// If voiture is provided, create car and driver for this user
		if (input.voiture) {
			const driverResult = await this.driverRepository.create({
				driverLicense: input.voiture,
				userId: user.id,
			});
			if (!driverResult.success) {
				logger.warn('Failed to create driver', { userId: user.id, errorCode: driverResult.error.code });
			}
		}

		return ok(user);
	}
}
