import { vi } from 'vitest';
import { container } from 'tsyringe';
import { TOKENS } from '../../src/lib/shared/di/tokens.js';
import { ok } from '../../src/lib/shared/types/result.js';

// Set DATABASE_URL before container module loads
process.env.DATABASE_URL ??= 'postgresql://mock:mock@localhost:5432/mock';

export const AUTH_TOKEN = 'valid-test-token';

export function authHeaders(extra?: Record<string, string>): Headers {
	return new Headers({
		'Content-Type': 'application/json',
		'x-auth-token': AUTH_TOKEN,
		...extra,
	});
}

export function jsonHeaders(): Headers {
	return new Headers({ 'Content-Type': 'application/json' });
}

export function registerMockJwtService(role = 'ADMIN') {
	const mockJwtService = {
		sign: vi.fn().mockResolvedValue(ok('signed-token')),
		verify: vi.fn().mockImplementation(async (token: string) => {
			if (token === AUTH_TOKEN) {
				return ok({ userId: 'test-user-id', role });
			}
			return { success: false, error: { code: 'TOKEN_INVALID', message: 'Invalid token' } };
		}),
	};
	container.registerInstance(TOKENS.JwtService, mockJwtService);
	return mockJwtService;
}

export function registerMockUseCase(UseCaseClass: any) {
	const mock = { execute: vi.fn() };
	container.register(UseCaseClass, { useValue: mock });
	return mock;
}
