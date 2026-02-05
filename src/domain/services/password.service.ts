import type { Result } from '../../lib/shared/types/result.js';
import type { PasswordError } from '../../infrastructure/errors/password.errors.js';

export interface PasswordService {
	hash(password: string): Promise<Result<string, PasswordError>>;
	verify(password: string, hash: string): Promise<Result<boolean, PasswordError>>;
}
