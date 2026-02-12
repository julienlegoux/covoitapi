/**
 * @module password.service
 * Defines the password service interface.
 * This contract abstracts password hashing and verification operations,
 * allowing different hashing algorithms (e.g. Argon2, bcrypt) to be swapped via DI.
 */

import type { Result } from '../../lib/shared/types/result.js';
import type { PasswordError } from '../../lib/errors/password.errors.js';

export interface PasswordService {
	/**
	 * Hashes a plain-text password for secure storage.
	 * @param password - The plain-text password to hash.
	 * @returns The hashed password string.
	 */
	hash(password: string): Promise<Result<string, PasswordError>>;

	/**
	 * Verifies a plain-text password against a stored hash.
	 * @param password - The plain-text password to verify.
	 * @param hash - The stored password hash to compare against.
	 * @returns True if the password matches the hash, false otherwise.
	 */
	verify(password: string, hash: string): Promise<Result<boolean, PasswordError>>;
}
