/**
 * @module LoginUseCase
 *
 * Handles user authentication by verifying credentials (email + password)
 * and issuing a signed JWT token upon successful login. This is the primary
 * entry point for existing users to obtain an access token for the carpooling API.
 */

import { inject, injectable } from 'tsyringe';
import { InvalidCredentialsError } from '../../../lib/errors/domain.errors.js';
import type { AuthRepository } from '../../../domain/repositories/auth.repository.js';
import type { UserRepository } from '../../../domain/repositories/user.repository.js';
import type { JwtService } from '../../../domain/services/jwt.service.js';
import type { PasswordService } from '../../../domain/services/password.service.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import type { PasswordError } from '../../../lib/errors/password.errors.js';
import type { JwtError } from '../../../lib/errors/jwt.errors.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import type { LoginSchemaType, AuthResponseType } from '../../schemas/auth.schema.js';

/**
 * Union of all possible error types returned by the login use case.
 *
 * - {@link InvalidCredentialsError} - Email not found, wrong password, or missing user profile
 * - {@link RepositoryError} - Database-level failure during auth/user lookup
 * - {@link PasswordError} - Failure during Argon2 password verification
 * - {@link JwtError} - Failure during JWT token signing
 */
type LoginError = InvalidCredentialsError | RepositoryError | PasswordError | JwtError;

/**
 * Authenticates a user with email and password credentials.
 *
 * Business flow:
 * 1. Look up the Auth record by email
 * 2. Verify the supplied password against the stored Argon2 hash
 * 3. Retrieve the associated User profile via the Auth's internal refId
 * 4. Sign a JWT containing the user's UUID and role
 * 5. Return the userId (UUID) and signed token
 *
 * Returns {@link InvalidCredentialsError} for any authentication failure
 * (unknown email, wrong password, or missing user profile) to avoid
 * leaking information about which step failed.
 *
 * @dependencies AuthRepository, UserRepository, PasswordService, JwtService
 */
@injectable()
export class LoginUseCase {
	private readonly logger: Logger;

	constructor(
		@inject(TOKENS.AuthRepository)
		private readonly authRepository: AuthRepository,
		@inject(TOKENS.UserRepository)
		private readonly userRepository: UserRepository,
		@inject(TOKENS.PasswordService)
		private readonly passwordService: PasswordService,
		@inject(TOKENS.JwtService)
		private readonly jwtService: JwtService,
		@inject(TOKENS.Logger) logger: Logger,
	) {
		this.logger = logger.child({ useCase: 'LoginUseCase' });
	}

	/**
	 * Executes the login flow for the given credentials.
	 *
	 * @param input - Validated login payload containing email and password
	 * @returns A Result containing the userId and JWT token on success,
	 *          or a LoginError on failure
	 */
	async execute(input: LoginSchemaType): Promise<Result<AuthResponseType, LoginError>> {
		// Find auth by email
		const authResult = await this.authRepository.findByEmail(input.email);
		if (!authResult.success) {
			return authResult;
		}

		const auth = authResult.value;
		if (!auth) {
			this.logger.warn('Login failed', { email: input.email });
			return err(new InvalidCredentialsError());
		}

		// Verify password
		const passwordResult = await this.passwordService.verify(input.password, auth.password);
		if (!passwordResult.success) {
			return passwordResult;
		}

		if (!passwordResult.value) {
			this.logger.warn('Login failed', { email: input.email });
			return err(new InvalidCredentialsError());
		}

		// Find associated user
		const userResult = await this.userRepository.findByAuthRefId(auth.refId);
		if (!userResult.success) {
			return userResult;
		}

		const user = userResult.value;
		if (!user) {
			this.logger.warn('Login failed', { email: input.email });
			return err(new InvalidCredentialsError());
		}

		// Generate token
		const tokenResult = await this.jwtService.sign({ userId: user.id, role: auth.role });
		if (!tokenResult.success) {
			return tokenResult;
		}

		this.logger.info('User logged in', { userId: user.id });
		return ok({
			userId: user.id,
			token: tokenResult.value,
		});
	}
}
