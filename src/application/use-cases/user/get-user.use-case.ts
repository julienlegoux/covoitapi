import { inject, injectable } from 'tsyringe';
import type { PublicUserEntity } from '../../../domain/entities/user.entity.js';
import { UserNotFoundError } from '../../../domain/errors/domain.errors.js';
import type { UserRepository } from '../../../domain/repositories/user.repository.js';
import type { RepositoryError } from '../../../infrastructure/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok, err } from '../../../lib/shared/types/result.js';

type GetUserError = UserNotFoundError | RepositoryError;

@injectable()
export class GetUserUseCase {
	constructor(
		@inject(TOKENS.UserRepository)
		private readonly userRepository: UserRepository,
	) {}

	async execute(id: string): Promise<Result<PublicUserEntity, GetUserError>> {
		const result = await this.userRepository.findById(id);
		if (!result.success) {
			return result;
		}

		if (!result.value) {
			return err(new UserNotFoundError(id));
		}

		return ok(result.value);
	}
}
