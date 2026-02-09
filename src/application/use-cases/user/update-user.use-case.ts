import { inject, injectable } from 'tsyringe';
import type { PublicUserEntity, UpdateUserData } from '../../../domain/entities/user.entity.js';
import { UserNotFoundError } from '../../../lib/errors/domain.errors.js';
import type { UserRepository } from '../../../domain/repositories/user.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';

type UpdateUserError = UserNotFoundError | RepositoryError;

export type UpdateProfileInput = {
	firstName?: string;
	lastName?: string;
	phone?: string;
};

@injectable()
export class UpdateUserUseCase {
	constructor(
		@inject(TOKENS.UserRepository)
		private readonly userRepository: UserRepository,
	) {}

	async execute(id: string, input: UpdateProfileInput): Promise<Result<PublicUserEntity, UpdateUserError>> {
		const findResult = await this.userRepository.findById(id);
		if (!findResult.success) {
			return findResult;
		}

		if (!findResult.value) {
			return err(new UserNotFoundError(id));
		}

		const updateData: UpdateUserData = {};
		if (input.firstName) updateData.firstName = input.firstName;
		if (input.lastName) updateData.lastName = input.lastName;
		if (input.phone) updateData.phone = input.phone;

		return this.userRepository.update(id, updateData);
	}
}
