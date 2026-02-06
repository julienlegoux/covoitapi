import { inject, injectable } from 'tsyringe';
import type { UserEntity } from '../../../domain/entities/user.entity.js';
import { UserNotFoundError } from '../../../domain/errors/domain.errors.js';
import type { UserRepository } from '../../../domain/repositories/user.repository.js';
import type { RepositoryError } from '../../../infrastructure/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';
import type { UpdatePersonInput, PatchPersonInput } from '../../dtos/person.dto.js';
import type { UpdateUserData } from '../../../domain/entities/user.entity.js';

type UpdatePersonError = UserNotFoundError | RepositoryError;

@injectable()
export class UpdatePersonUseCase {
	constructor(
		@inject(TOKENS.UserRepository)
		private readonly userRepository: UserRepository,
	) {}

	async execute(id: string, input: UpdatePersonInput | PatchPersonInput): Promise<Result<UserEntity, UpdatePersonError>> {
		const findResult = await this.userRepository.findById(id);
		if (!findResult.success) {
			return findResult;
		}

		if (!findResult.value) {
			return err(new UserNotFoundError(id));
		}

		const updateData: UpdateUserData = {};
		if ('firstName' in input && input.firstName) updateData.firstName = input.firstName;
		if ('lastName' in input && input.lastName) updateData.lastName = input.lastName;
		if (input.email) updateData.email = input.email;
		if (input.phone) updateData.phone = input.phone;

		return this.userRepository.update(id, updateData);
	}
}
