import { inject, injectable } from 'tsyringe';
import { InvalidCredentialsError } from '../../../domain/errors/domain.errors.js';
import type { UserRepository } from '../../../domain/repositories/user.repository.js';
import type { JwtService } from '../../../domain/services/jwt.service.js';
import type { PasswordService } from '../../../domain/services/password.service.js';
import type { RepositoryError } from '../../../infrastructure/errors/repository.errors.js';
import type { PasswordError } from '../../../infrastructure/errors/password.errors.js';
import type { JwtError } from '../../../infrastructure/errors/jwt.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import type { AuthResponse, LoginInput } from '../../dtos/auth.dto.js';

type LoginError = InvalidCredentialsError | RepositoryError | PasswordError | JwtError;

@injectable()
export class LoginUseCase {
	constructor(
		@inject(TOKENS.UserRepository)
		private readonly userRepository: UserRepository,
		@inject(TOKENS.PasswordService)
		private readonly passwordService: PasswordService,
		@inject(TOKENS.JwtService)
		private readonly jwtService: JwtService,
	) {}

	async execute(input: LoginInput): Promise<Result<AuthResponse, LoginError>> {
		// Find user by email
		const userResult = await this.userRepository.findByEmail(input.email);
		if (!userResult.success) {
			return userResult;
		}

		const user = userResult.value;
		if (!user) {
			return err(new InvalidCredentialsError());
		}

		// Verify password
		const passwordResult = await this.passwordService.verify(input.password, user.password);
		if (!passwordResult.success) {
			return passwordResult;
		}

		if (!passwordResult.value) {
			return err(new InvalidCredentialsError());
		}

		// Generate token
		const tokenResult = await this.jwtService.sign({ userId: user.id });
		if (!tokenResult.success) {
			return tokenResult;
		}

		return ok({
			userId: user.id,
			token: tokenResult.value,
		});
	}
}
