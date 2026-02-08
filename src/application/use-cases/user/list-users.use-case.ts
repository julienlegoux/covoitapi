import { inject, injectable } from 'tsyringe';
import type { PublicUserEntity } from '../../../domain/entities/user.entity.js';
import type { UserRepository } from '../../../domain/repositories/user.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';

@injectable()
export class ListUsersUseCase {
	constructor(
		@inject(TOKENS.UserRepository)
		private readonly userRepository: UserRepository,
	) {}

	async execute(): Promise<Result<PublicUserEntity[], RepositoryError>> {
		return this.userRepository.findAll();
	}
}
