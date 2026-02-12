/**
 * @module auth.repository
 * Defines the authentication repository interface.
 * This contract abstracts all persistence operations related to Auth records,
 * allowing the application layer to remain independent of the database implementation.
 */

import type { Result } from '../../lib/shared/types/result.js';
import type { RepositoryError } from '../../lib/errors/repository.errors.js';
import type { AuthEntity, CreateAuthData } from '../entities/auth.entity.js';
import type { CreateUserData } from '../entities/user.entity.js';
import type { PublicUserEntity } from '../entities/user.entity.js';

export interface AuthRepository {
	/**
	 * Finds an authentication record by email address.
	 * @param email - The email address to search for.
	 * @returns The matching AuthEntity, or null if not found.
	 */
	findByEmail(email: string): Promise<Result<AuthEntity | null, RepositoryError>>;

	/**
	 * Creates a new Auth and User record atomically within a transaction.
	 * The authRefId on the User is set automatically from the created Auth record.
	 * @param authData - Email and hashed password for the Auth record.
	 * @param userData - Profile data for the User record (authRefId is omitted and set internally).
	 * @returns The created Auth and PublicUser entities.
	 */
	createWithUser(
		authData: CreateAuthData,
		userData: Omit<CreateUserData, 'authRefId'>,
	): Promise<Result<{ auth: AuthEntity; user: PublicUserEntity }, RepositoryError>>;

	/**
	 * Checks whether an authentication record with the given email exists.
	 * @param email - The email address to check.
	 * @returns True if an Auth record with this email exists, false otherwise.
	 */
	existsByEmail(email: string): Promise<Result<boolean, RepositoryError>>;

	/**
	 * Updates the role of an authentication record.
	 * @param refId - The integer refId of the Auth record to update.
	 * @param role - The new role value (e.g. "USER", "ADMIN").
	 * @returns Void on success.
	 */
	updateRole(refId: number, role: string): Promise<Result<void, RepositoryError>>;
}
