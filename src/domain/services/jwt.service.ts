import type { Result } from '../../lib/shared/types/result.js';
import type { JwtError } from '../../infrastructure/errors/jwt.errors.js';

export type JwtPayload = {
	userId: string;
	role: string;
};

export interface JwtService {
	sign(payload: JwtPayload): Promise<Result<string, JwtError>>;
	verify(token: string): Promise<Result<JwtPayload, JwtError>>;
}
