/**
 * @module argon-password.service
 * Argon2-based implementation of the {@link PasswordService} domain interface.
 * Provides secure password hashing and verification using the Argon2id algorithm
 * (the argon2 library default), which is resistant to GPU and side-channel attacks.
 */

import * as argon2 from 'argon2';
import { injectable } from 'tsyringe';
import type { PasswordService } from '../../domain/services/password.service.js';
import type { Result } from '../../lib/shared/types/result.js';
import { ok, err } from '../../lib/shared/types/result.js';
import { HashingError, HashVerificationError } from '../../lib/errors/password.errors.js';

/**
 * Argon2 implementation of {@link PasswordService}.
 * Uses the `argon2` npm package with default Argon2id parameters.
 * Each hash includes a random salt, so hashing the same password twice
 * produces different outputs. All errors are wrapped in typed Result errors.
 * Injected via tsyringe as a singleton.
 */
@injectable()
export class ArgonPasswordService implements PasswordService {
	/**
	 * Hashes a plaintext password using Argon2id.
	 * The resulting hash string includes the algorithm, salt, and parameters
	 * (e.g. "$argon2id$v=19$m=65536,t=3,p=4$...").
	 * @param password - The plaintext password to hash.
	 * @returns `ok(string)` with the Argon2 hash on success,
	 *          or `err(HashingError)` if the hashing operation fails.
	 */
	async hash(password: string): Promise<Result<string, HashingError>> {
		try {
			const hashed: string = await argon2.hash(password);
			return ok(hashed);
		} catch (e) {
			return err(new HashingError(e));
		}
	}

	/**
	 * Verifies a plaintext password against a stored Argon2 hash.
	 * @param password - The plaintext password to verify.
	 * @param hash - The stored Argon2 hash string to compare against.
	 * @returns `ok(true)` if the password matches, `ok(false)` if it does not,
	 *          or `err(HashVerificationError)` if the verification operation fails
	 *          (e.g. malformed hash string).
	 */
	async verify(password: string, hash: string): Promise<Result<boolean, HashVerificationError>> {
		try {
			const valid: boolean = await argon2.verify(hash, password);
			return ok(valid);
		} catch (e) {
			return err(new HashVerificationError(e));
		}
	}
}
