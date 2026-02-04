import { describe, expect, it } from 'vitest';
import { ArgonPasswordService } from './argon-password.service.js';

describe('ArgonPasswordService', () => {
	const passwordService = new ArgonPasswordService();

	it('should hash a password', async () => {
		const password = 'TestPassword123!';
		const hash = await passwordService.hash(password);

		expect(hash).toBeDefined();
		expect(hash).not.toBe(password);
		expect(hash.startsWith('$argon2')).toBe(true);
	});

	it('should verify a correct password', async () => {
		const password = 'TestPassword123!';
		const hash = await passwordService.hash(password);

		const isValid = await passwordService.verify(password, hash);
		expect(isValid).toBe(true);
	});

	it('should reject an incorrect password', async () => {
		const password = 'TestPassword123!';
		const wrongPassword = 'WrongPassword456!';
		const hash = await passwordService.hash(password);

		const isValid = await passwordService.verify(wrongPassword, hash);
		expect(isValid).toBe(false);
	});

	it('should generate different hashes for the same password', async () => {
		const password = 'TestPassword123!';
		const hash1 = await passwordService.hash(password);
		const hash2 = await passwordService.hash(password);

		expect(hash1).not.toBe(hash2);
	});
});
