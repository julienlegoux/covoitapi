/**
 * @module hono-jwt.service
 * Hono JWT-based implementation of the {@link JwtService} domain interface.
 * Handles JWT token signing and verification using Hono's built-in JWT
 * utilities with HS256 algorithm. Reads configuration from environment
 * variables (JWT_SECRET, JWT_EXPIRES_IN).
 */

import { sign as honoSign, verify as honoVerify } from 'hono/jwt';
import { inject, injectable } from 'tsyringe';
import type { JwtPayload, JwtService } from '../../domain/services/jwt.service.js';
import type { Logger } from '../../lib/logging/logger.types.js';
import { TOKENS } from '../../lib/shared/di/tokens.js';
import type { Result } from '../../lib/shared/types/result.js';
import { ok, err } from '../../lib/shared/types/result.js';
import {
	TokenExpiredError,
	TokenInvalidError,
	TokenMalformedError,
	TokenSigningError,
} from '../../lib/errors/jwt.errors.js';

/**
 * Hono JWT implementation of {@link JwtService}.
 * Uses `hono/jwt` sign/verify functions with HS256 algorithm.
 * The JWT secret is read from `JWT_SECRET` env var (required at construction time).
 * Token expiration is configured via `JWT_EXPIRES_IN` env var (defaults to "24h").
 * Supports h (hours), d (days), and m (minutes) duration formats.
 * All errors are classified into typed Result error variants.
 * Injected via tsyringe as a singleton.
 */
@injectable()
export class HonoJwtService implements JwtService {
	private readonly secret: string;
	private readonly expiresIn: string;
	private readonly logger: Logger;

	/**
	 * Reads JWT configuration from environment variables.
	 * @throws {Error} If JWT_SECRET is not set.
	 */
	constructor(@inject(TOKENS.Logger) logger: Logger) {
		this.logger = logger.child({ service: 'JwtService' });
		const secret = process.env.JWT_SECRET;
		if (!secret) {
			throw new Error('JWT_SECRET environment variable is required');
		}
		this.secret = secret;
		this.expiresIn = process.env.JWT_EXPIRES_IN || '24h';
	}

	/**
	 * Signs a JWT payload with an expiration timestamp using HS256.
	 * @param payload - The JWT payload containing userId and role.
	 * @returns `ok(string)` with the signed JWT token,
	 *          or `err(TokenSigningError)` if signing fails.
	 */
	async sign(payload: JwtPayload): Promise<Result<string, TokenSigningError>> {
		try {
			// Calculate Unix timestamp expiration and merge into payload
			const exp = this.calculateExpiration();
			const token = await honoSign({ ...payload, exp }, this.secret, 'HS256');
			return ok(token);
		} catch (e) {
			this.logger.error('Token signing failed', e instanceof Error ? e : null, { userId: payload.userId });
			return err(new TokenSigningError(e));
		}
	}

	/**
	 * Verifies and decodes a JWT token, extracting the userId and role.
	 * Validates that the decoded payload contains a string userId.
	 * Role defaults to "USER" when not present in the token.
	 * @param token - The JWT token string to verify.
	 * @returns `ok(JwtPayload)` with userId and role on success, or a typed error:
	 *          `err(TokenExpiredError)` if the token has expired,
	 *          `err(TokenMalformedError)` if the token format is invalid,
	 *          `err(TokenInvalidError)` for other verification failures.
	 */
	async verify(token: string): Promise<Result<JwtPayload, TokenExpiredError | TokenInvalidError | TokenMalformedError>> {
		try {
			const decoded = await honoVerify(token, this.secret, 'HS256');

			// Validate that userId exists and is a string
			if (!decoded.userId || typeof decoded.userId !== 'string') {
				return err(new TokenInvalidError('Token payload missing userId'));
			}

			return ok({ userId: decoded.userId, role: (decoded.role as string) ?? 'USER' });
		} catch (e) {
			// Classify the raw JWT error into a typed domain error
			const classified = this.classifyJwtError(e);
			this.logger.warn('Token verification failed', { errorCode: classified.code });
			return err(classified);
		}
	}

	/**
	 * Classifies a raw JWT verification error into a typed domain error
	 * based on the error message content.
	 * @param e - The unknown error thrown by hono/jwt verify.
	 * @returns A typed error: TokenExpiredError, TokenMalformedError, or TokenInvalidError.
	 */
	private classifyJwtError(e: unknown): TokenExpiredError | TokenMalformedError | TokenInvalidError {
		const error = e instanceof Error ? e : new Error(String(e));
		const message = error.message.toLowerCase();

		if (message.includes('expired')) {
			return new TokenExpiredError(e);
		}
		if (message.includes('malformed') || message.includes('invalid token')) {
			return new TokenMalformedError(e);
		}
		return new TokenInvalidError(e);
	}

	/**
	 * Calculates the token expiration as a Unix timestamp (seconds since epoch).
	 * Parses the `expiresIn` string (e.g. "24h", "7d", "30m").
	 * Falls back to 24 hours if the format is not recognized.
	 * @returns Unix timestamp for the token expiration.
	 */
	private calculateExpiration(): number {
		const now = Math.floor(Date.now() / 1000);
		const match = /^(\d+)([hdm])$/.exec(this.expiresIn);

		if (!match) {
			// Default to 24 hours for unrecognized format
			return now + 24 * 60 * 60;
		}

		const value = Number.parseInt(match[1], 10);
		const unit = match[2];

		switch (unit) {
			case 'h':
				return now + value * 60 * 60;
			case 'd':
				return now + value * 24 * 60 * 60;
			case 'm':
				return now + value * 60;
			default:
				return now + 24 * 60 * 60;
		}
	}
}
