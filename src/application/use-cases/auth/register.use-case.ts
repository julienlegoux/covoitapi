import { inject, injectable } from 'tsyringe';
import { UserAlreadyExistsError } from '../../../lib/errors/domain.errors.js';
import type { AuthRepository } from '../../../domain/repositories/auth.repository.js';
import type { EmailService } from '../../../domain/services/email.service.js';
import type { JwtService } from '../../../domain/services/jwt.service.js';
import type { PasswordService } from '../../../domain/services/password.service.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import type { PasswordError } from '../../../lib/errors/password.errors.js';
import type { JwtError } from '../../../lib/errors/jwt.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import type { AuthResponse, RegisterInput } from '../../dtos/auth.dto.js';
import { logger } from '../../../lib/logging/logger.js';

export type RegisterError = UserAlreadyExistsError | RepositoryError | PasswordError | JwtError;

@injectable()
export class RegisterUseCase {
	constructor(
		@inject(TOKENS.AuthRepository)
		private readonly authRepository: AuthRepository,
		@inject(TOKENS.PasswordService)
		private readonly passwordService: PasswordService,
		@inject(TOKENS.EmailService)
		private readonly emailService: EmailService,
		@inject(TOKENS.JwtService)
		private readonly jwtService: JwtService,
	) {}

	async execute(input: RegisterInput): Promise<Result<AuthResponse, RegisterError>> {
		// Check if email already exists
		const existsResult = await this.authRepository.existsByEmail(input.email);
		if (!existsResult.success) {
			return existsResult;
		}

		if (existsResult.value) {
			return err(new UserAlreadyExistsError(input.email));
		}

		// Hash password
		const hashResult = await this.passwordService.hash(input.password);
		if (!hashResult.success) {
			return hashResult;
		}

		// Create auth + user in transaction
		const createResult = await this.authRepository.createWithUser(
			{ email: input.email, password: hashResult.value },
			{ firstName: null, lastName: null, phone: null },
		);
		if (!createResult.success) {
			return createResult;
		}

		const { auth, user } = createResult.value;

		// Send welcome email (don't fail registration if email fails)
		const emailResult = await this.emailService.sendWelcomeEmail(auth.email, user.firstName ?? 'there');
		if (!emailResult.success) {
			logger.warn('Failed to send welcome email', {
				userId: user.id,
				email: auth.email,
				errorCode: emailResult.error.code,
				errorMessage: emailResult.error.message,
			});
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
