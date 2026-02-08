import { inject, injectable } from 'tsyringe';
import type { PublicUserEntity } from '../../../domain/entities/user.entity.js';
import { UserAlreadyExistsError } from '../../../lib/errors/domain.errors.js';
import type { UserRepository } from '../../../domain/repositories/user.repository.js';
import type { PasswordService } from '../../../domain/services/password.service.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import type { PasswordError } from '../../../lib/errors/password.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';
import type { CreatePersonInput } from '../../dtos/person.dto.js';

type CreateUserError = UserAlreadyExistsError | RepositoryError | PasswordError;

@injectable()
export class CreateUserUseCase {
	constructor(
		@inject(TOKENS.UserRepository)
		private readonly userRepository: UserRepository,
		@inject(TOKENS.PasswordService)
		private readonly passwordService: PasswordService,
	) {}

	async execute(input: CreatePersonInput): Promise<Result<PublicUserEntity, CreateUserError>> {
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

		return this.userRepository.create({
			email: input.email,
			password: hashResult.value,
			firstName: input.firstName,
			lastName: input.lastName,
			phone: input.phone,
		});
	}
}
