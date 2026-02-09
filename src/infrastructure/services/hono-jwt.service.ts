import { sign as honoSign, verify as honoVerify } from 'hono/jwt';
import { injectable } from 'tsyringe';
import type { JwtPayload, JwtService } from '../../domain/services/jwt.service.js';
import type { Result } from '../../lib/shared/types/result.js';
import { ok, err } from '../../lib/shared/types/result.js';
import {
	TokenExpiredError,
	TokenInvalidError,
	TokenMalformedError,
	TokenSigningError,
} from '../../lib/errors/jwt.errors.js';

@injectable()
export class HonoJwtService implements JwtService {
	private readonly secret: string;
	private readonly expiresIn: string;

	constructor() {
		const secret = process.env.JWT_SECRET;
		if (!secret) {
			throw new Error('JWT_SECRET environment variable is required');
		}
		this.secret = secret;
		this.expiresIn = process.env.JWT_EXPIRES_IN || '24h';
	}

	async sign(payload: JwtPayload): Promise<Result<string, TokenSigningError>> {
		try {
			const exp = this.calculateExpiration();
			const token = await honoSign({ ...payload, exp }, this.secret, 'HS256');
			return ok(token);
		} catch (e) {
			return err(new TokenSigningError(e));
		}
	}

	async verify(token: string): Promise<Result<JwtPayload, TokenExpiredError | TokenInvalidError | TokenMalformedError>> {
		try {
			const decoded = await honoVerify(token, this.secret, 'HS256');

			if (!decoded.userId || typeof decoded.userId !== 'string') {
				return err(new TokenInvalidError('Token payload missing userId'));
			}

			return ok({ userId: decoded.userId, role: (decoded.role as string) ?? 'USER' });
		} catch (e) {
			return err(this.classifyJwtError(e));
		}
	}

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

	private calculateExpiration(): number {
		const now = Math.floor(Date.now() / 1000);
		const match = /^(\d+)([hdm])$/.exec(this.expiresIn);

		if (!match) {
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
