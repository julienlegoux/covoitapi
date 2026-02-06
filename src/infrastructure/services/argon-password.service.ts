import * as argon2 from 'argon2';
import { injectable } from 'tsyringe';
import type { PasswordService } from '../../domain/services/password.service.js';
import type { Result } from '../../lib/shared/types/result.js';
import { ok, err } from '../../lib/shared/types/result.js';
import { HashingError, HashVerificationError } from '../errors/password.errors.js';

@injectable()
export class ArgonPasswordService implements PasswordService {
	async hash(password: string): Promise<Result<string, HashingError>> {
		try {
			const hashed: string = await argon2.hash(password);
			return ok(hashed);
		} catch (e) {
			return err(new HashingError(e));
		}
	}

	async verify(password: string, hash: string): Promise<Result<boolean, HashVerificationError>> {
		try {
			const valid: boolean = await argon2.verify(hash, password);
			return ok(valid);
		} catch (e) {
			return err(new HashVerificationError(e));
		}
	}
}
