import * as argon2 from 'argon2';
import { injectable } from 'tsyringe';
import type { PasswordService } from '../../domain/services/password.service.js';

@injectable()
export class ArgonPasswordService implements PasswordService {
	async hash(password: string): Promise<string> {
		return argon2.hash(password);
	}

	async verify(password: string, hash: string): Promise<boolean> {
		return argon2.verify(hash, password);
	}
}
