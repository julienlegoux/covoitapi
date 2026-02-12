/**
 * @module jwt.service
 * Defines the JWT service interface and its payload type.
 * This contract abstracts JSON Web Token operations (signing and verification),
 * allowing different JWT implementations to be swapped via dependency injection.
 */

import type { Result } from '../../lib/shared/types/result.js';
import type { JwtError } from '../../lib/errors/jwt.errors.js';

/**
 * The payload embedded in JWT tokens.
 *
 * @property userId - The UUID of the authenticated user.
 * @property role - The user's role (e.g. "USER", "ADMIN").
 */
export type JwtPayload = {
	userId: string;
	role: string;
};

export interface JwtService {
	/**
	 * Signs a payload into a JWT token string.
	 * @param payload - The data to embed in the token (userId, role).
	 * @returns The signed JWT token string.
	 */
	sign(payload: JwtPayload): Promise<Result<string, JwtError>>;

	/**
	 * Verifies and decodes a JWT token.
	 * @param token - The JWT token string to verify.
	 * @returns The decoded JwtPayload if the token is valid.
	 */
	verify(token: string): Promise<Result<JwtPayload, JwtError>>;
}
