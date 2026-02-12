/**
 * @module argon-password.service.test
 * Unit tests for {@link ArgonPasswordService}.
 * Verifies Argon2 hashing produces valid hash strings, correct/incorrect
 * password verification, and that each invocation produces a unique hash
 * (due to random salting).
 */

import { describe, expect, it } from 'vitest';
import { ArgonPasswordService } from './argon-password.service.js';
import { createMockLogger } from '../../../tests/setup.js';

// Integration tests using real Argon2 hashing (no mocks)
describe('ArgonPasswordService', () => {
	const passwordService = new ArgonPasswordService(createMockLogger() as any);

	it('should hash a password', async () => {
		const password = 'TestPassword123!';
		const result = await passwordService.hash(password);

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.value).toBeDefined();
			expect(result.value).not.toBe(password);
			expect(result.value.startsWith('$argon2')).toBe(true);
		}
	});

	it('should verify a correct password', async () => {
		const password = 'TestPassword123!';
		const hashResult = await passwordService.hash(password);

		expect(hashResult.success).toBe(true);
		if (hashResult.success) {
			const verifyResult = await passwordService.verify(password, hashResult.value);
			expect(verifyResult.success).toBe(true);
			if (verifyResult.success) {
				expect(verifyResult.value).toBe(true);
			}
		}
	});

	it('should reject an incorrect password', async () => {
		const password = 'TestPassword123!';
		const wrongPassword = 'WrongPassword456!';
		const hashResult = await passwordService.hash(password);

		expect(hashResult.success).toBe(true);
		if (hashResult.success) {
			const verifyResult = await passwordService.verify(wrongPassword, hashResult.value);
			expect(verifyResult.success).toBe(true);
			if (verifyResult.success) {
				expect(verifyResult.value).toBe(false);
			}
		}
	});

	it('should generate different hashes for the same password', async () => {
		const password = 'TestPassword123!';
		const result1 = await passwordService.hash(password);
		const result2 = await passwordService.hash(password);

		expect(result1.success).toBe(true);
		expect(result2.success).toBe(true);
		if (result1.success && result2.success) {
			expect(result1.value).not.toBe(result2.value);
		}
	});
});
