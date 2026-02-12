/**
 * @module CreateDriverUseCase
 *
 * Promotes an existing user to the "driver" role on the carpooling platform.
 * A driver profile stores the driver's license number and is linked to the
 * User entity via the internal refId. Upon successful creation the user's
 * Auth role is upgraded from USER to DRIVER.
 */

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

/**
 * Union of all possible error types returned by the create driver use case.
 *
 * - {@link DriverAlreadyExistsError} - The user already has a driver profile
 * - {@link UserNotFoundError} - No user exists with the given UUID
 * - {@link RepositoryError} - Database-level failure during any step
 */
type CreateDriverError = DriverAlreadyExistsError | UserNotFoundError | RepositoryError;

/**
 * Creates a driver profile and upgrades the user's role.
 *
 * Business flow:
 * 1. Resolve the user UUID to get the internal refId
 * 2. Check the user does not already have a driver profile
 * 3. Create the driver record with the driver license and user refId
 * 4. On success, upgrade the Auth role from USER to DRIVER
 *    (role update failure is silently tolerated -- the driver is still created)
 *
 * The {@link WithAuthContext} wrapper adds the authenticated userId from the JWT.
 *
 * @dependencies DriverRepository, UserRepository, AuthRepository
 */
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

	/**
	 * Creates a driver profile for the authenticated user.
	 *
	 * @param input - Validated payload containing driverLicense and the authenticated userId
	 * @returns A Result containing the created DriverEntity on success,
	 *          or a CreateDriverError on failure
	 */
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
