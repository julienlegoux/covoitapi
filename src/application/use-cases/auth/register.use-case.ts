/**
 * @module RegisterUseCase
 *
 * Handles new user registration for the carpooling platform. Creates an Auth
 * record (email + hashed password) and a linked User profile in a single
 * database transaction, sends a welcome email, and returns a JWT so the
 * user is immediately authenticated after sign-up.
 */

import { inject, injectable } from 'tsyringe';
import { UserAlreadyExistsError } from '../../../lib/errors/domain.errors.js';
import type { AuthRepository } from '../../../domain/repositories/auth.repository.js';
import type { EmailService } from '../../../domain/services/email.service.js';
import type { JwtService } from '../../../domain/services/jwt.service.js';
import type { PasswordService } from '../../../domain/services/password.service.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import type { PasswordError } from '../../../lib/errors/password.errors.js';
import type { JwtError } from '../../../lib/errors/jwt.errors.js';
import type { Logger } from '../../../lib/logging/logger.types.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import type { RegisterSchemaType, AuthResponseType } from '../../schemas/auth.schema.js';

/**
 * Union of all possible error types returned by the registration use case.
 *
 * - {@link UserAlreadyExistsError} - The supplied email is already registered
 * - {@link RepositoryError} - Database-level failure during existence check or creation
 * - {@link PasswordError} - Failure during Argon2 password hashing
 * - {@link JwtError} - Failure during JWT token signing
 */
export type RegisterError = UserAlreadyExistsError | RepositoryError | PasswordError | JwtError;

/**
 * Registers a new user on the carpooling platform.
 *
 * Business flow:
 * 1. Verify the email is not already registered
 * 2. Hash the password with Argon2
 * 3. Create Auth + User records atomically in a single transaction
 * 4. Send a welcome email (failure is logged but does not abort registration)
 * 5. Sign a JWT so the user is immediately authenticated
 * 6. Return the userId (UUID) and signed token
 *
 * The User profile is initially created with null firstName, lastName, and phone;
 * these are populated later via the update-user use case.
 *
 * @dependencies AuthRepository, PasswordService, EmailService, JwtService
 */
@injectable()
export class RegisterUseCase {
	private readonly logger: Logger;

	constructor(
		@inject(TOKENS.AuthRepository)
		private readonly authRepository: AuthRepository,
		@inject(TOKENS.PasswordService)
		private readonly passwordService: PasswordService,
		@inject(TOKENS.EmailService)
		private readonly emailService: EmailService,
		@inject(TOKENS.JwtService)
		private readonly jwtService: JwtService,
		@inject(TOKENS.Logger) logger: Logger,
	) {
		this.logger = logger.child({ useCase: 'RegisterUseCase' });
	}

	/**
	 * Executes the registration flow for a new user.
	 *
	 * @param input - Validated registration payload containing email, password,
	 *                and confirmPassword
	 * @returns A Result containing the userId and JWT token on success,
	 *          or a RegisterError on failure
	 */
	async execute(input: RegisterSchemaType): Promise<Result<AuthResponseType, RegisterError>> {
		// Check if email already exists
		const existsResult = await this.authRepository.existsByEmail(input.email);
		if (!existsResult.success) {
			return existsResult;
		}

		if (existsResult.value) {
			this.logger.warn('Registration failed: email already exists', { email: input.email });
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
			this.logger.warn('Failed to send welcome email', {
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

		this.logger.info('User registered', { userId: user.id });
		return ok({
			userId: user.id,
			token: tokenResult.value,
		});
	}
}
