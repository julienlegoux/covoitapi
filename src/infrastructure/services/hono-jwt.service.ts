import { sign, verify } from 'hono/jwt';
import { injectable } from 'tsyringe';
import type { JwtPayload, JwtService } from '@/domain/services/jwt.service.js';

@injectable()
export class HonoJwtService implements JwtService {
	private readonly secret: string;
	private readonly expiresIn: string;

	constructor() {
		this.secret = process.env.JWT_SECRET!;
		this.expiresIn = process.env.JWT_EXPIRES_IN || '24h';
	}

	async sign(payload: JwtPayload): Promise<string> {
		const exp = this.calculateExpiration();
		return sign({ ...payload, exp }, this.secret, 'HS256');
	}

	async verify(token: string): Promise<JwtPayload | null> {
		try {
			const decoded = await verify(token, this.secret, 'HS256');
			return { userId: decoded.userId as string };
		} catch {
			return null;
		}
	}

	private calculateExpiration(): number {
		const now = Math.floor(Date.now() / 1000);
		const match = this.expiresIn.match(/^(\d+)(h|d|m)$/);

		if (!match) {
			return now + 24 * 60 * 60;
		}

		const value = parseInt(match[1], 10);
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
