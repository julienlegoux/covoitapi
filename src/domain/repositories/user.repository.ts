/**
 * @module user.repository
 * Defines the user repository interface.
 * This contract abstracts all persistence operations related to User profiles,
 * including CRUD, lookup by Auth reference, and GDPR anonymization.
 */

import type { Result } from '../../lib/shared/types/result.js';
import type { RepositoryError } from '../../lib/errors/repository.errors.js';
import type { CreateUserData, PublicUserEntity, UpdateUserData } from '../entities/user.entity.js';

export interface UserRepository {
	/**
	 * Retrieves all user profiles with their associated emails.
	 * @returns An array of all PublicUserEntity records.
	 */
	findAll(): Promise<Result<PublicUserEntity[], RepositoryError>>;

	/**
	 * Finds a user profile by its UUID.
	 * @param id - The UUID of the user to find.
	 * @returns The matching PublicUserEntity, or null if not found.
	 */
	findById(id: string): Promise<Result<PublicUserEntity | null, RepositoryError>>;

	/**
	 * Finds a user profile by its associated Auth record's refId.
	 * @param authRefId - The integer refId of the linked Auth record.
	 * @returns The matching PublicUserEntity, or null if not found.
	 */
	findByAuthRefId(authRefId: number): Promise<Result<PublicUserEntity | null, RepositoryError>>;

	/**
	 * Creates a new user profile.
	 * @param data - The user profile data including the authRefId link.
	 * @returns The newly created PublicUserEntity.
	 */
	create(data: CreateUserData): Promise<Result<PublicUserEntity, RepositoryError>>;

	/**
	 * Updates an existing user profile's fields.
	 * @param id - The UUID of the user to update.
	 * @param data - Partial update payload (firstName, lastName, phone).
	 * @returns The updated PublicUserEntity.
	 */
	update(id: string, data: UpdateUserData): Promise<Result<PublicUserEntity, RepositoryError>>;

	/**
	 * Hard-deletes a user profile by UUID.
	 * @param id - The UUID of the user to delete.
	 * @returns Void on success.
	 */
	delete(id: string): Promise<Result<void, RepositoryError>>;

	/**
	 * Anonymizes a user profile for GDPR compliance.
	 * Replaces personal data with anonymized placeholders and sets the anonymizedAt timestamp.
	 * @param id - The UUID of the user to anonymize.
	 * @returns Void on success.
	 */
	anonymize(id: string): Promise<Result<void, RepositoryError>>;
}
