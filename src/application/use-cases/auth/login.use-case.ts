import { inject, injectable } from 'tsyringe';
import { InvalidCredentialsError } from '../../../lib/errors/domain.errors.js';
import type { AuthRepository } from '../../../domain/repositories/auth.repository.js';
import type { UserRepository } from '../../../domain/repositories/user.repository.js';
import type { JwtService } from '../../../domain/services/jwt.service.js';
import type { PasswordService } from '../../../domain/services/password.service.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import type { PasswordError } from '../../../lib/errors/password.errors.js';
import type { JwtError } from '../../../lib/errors/jwt.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import type { AuthResponse, LoginInput } from '../../dtos/auth.dto.js';

type LoginError = InvalidCredentialsError | RepositoryError | PasswordError | JwtError;

@injectable()
export class LoginUseCase {
	constructor(
		@inject(TOKENS.AuthRepository)
		private readonly authRepository: AuthRepository,
		@inject(TOKENS.UserRepository)
		private readonly userRepository: UserRepository,
		@inject(TOKENS.PasswordService)
		private readonly passwordService: PasswordService,
		@inject(TOKENS.JwtService)
		private readonly jwtService: JwtService,
	) {}

	async execute(input: LoginInput): Promise<Result<AuthResponse, LoginError>> {
		// Find auth by email
		const authResult = await this.authRepository.findByEmail(input.email);
		if (!authResult.success) {
			return authResult;
		}

		const auth = authResult.value;
		if (!auth) {
			return err(new InvalidCredentialsError());
		}

		// Verify password
		const passwordResult = await this.passwordService.verify(input.password, auth.password);
		if (!passwordResult.success) {
			return passwordResult;
		}

		if (!passwordResult.value) {
			return err(new InvalidCredentialsError());
		}

		// Find associated user
		const userResult = await this.userRepository.findByAuthRefId(auth.refId);
		if (!userResult.success) {
			return userResult;
		}

		const user = userResult.value;
		if (!user) {
			return err(new InvalidCredentialsError());
		}

		// Generate token
		const tokenResult = await this.jwtService.sign({ userId: user.id, role: auth.role });
		if (!tokenResult.success) {
			return tokenResult;
		}

		return ok({
			userId: user.id,
			token: tokenResult.value,
		});
	}
}
