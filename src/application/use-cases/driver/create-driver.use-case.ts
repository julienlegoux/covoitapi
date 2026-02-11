import { inject, injectable } from 'tsyringe';
import type { DriverEntity } from '../../../domain/entities/driver.entity.js';
import { DriverAlreadyExistsError, UserNotFoundError } from '../../../lib/errors/domain.errors.js';
import type { AuthRepository } from '../../../domain/repositories/auth.repository.js';
import type { DriverRepository } from '../../../domain/repositories/driver.repository.js';
import type { UserRepository } from '../../../domain/repositories/user.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';
import type { CreateDriverSchemaType } from '../../schemas/driver.schema.js';
import type { WithAuthContext } from '../../../lib/shared/types/auth-context.js';

type CreateDriverError = DriverAlreadyExistsError | UserNotFoundError | RepositoryError;

@injectable()
export class CreateDriverUseCase {
	constructor(
		@inject(TOKENS.DriverRepository)
		private readonly driverRepository: DriverRepository,
		@inject(TOKENS.UserRepository)
		private readonly userRepository: UserRepository,
		@inject(TOKENS.AuthRepository)
		private readonly authRepository: AuthRepository,
	) {}

	async execute(input: WithAuthContext<CreateDriverSchemaType>): Promise<Result<DriverEntity, CreateDriverError>> {
		// Look up user to get refId
		const userResult = await this.userRepository.findById(input.userId);
		if (!userResult.success) {
			return userResult;
		}
		if (!userResult.value) {
			return err(new UserNotFoundError(input.userId));
		}

		const user = userResult.value;

		const existingResult = await this.driverRepository.findByUserRefId(user.refId);
		if (!existingResult.success) {
			return existingResult;
		}

		if (existingResult.value) {
			return err(new DriverAlreadyExistsError(input.userId));
		}

		const createResult = await this.driverRepository.create({
			driverLicense: input.driverLicense,
			userRefId: user.refId,
		});

		if (createResult.success) {
			await this.authRepository.updateRole(user.authRefId, 'DRIVER');
		}

		return createResult;
	}
}
