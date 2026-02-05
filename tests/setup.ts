import 'reflect-metadata';
import type { Context, Next } from 'hono';
import { container } from 'tsyringe';
import { beforeEach, vi } from 'vitest';

beforeEach(() => {
	container.clearInstances();
});

export function createMockUserRepository() {
	return {
		findById: vi.fn(),
		findByEmail: vi.fn(),
		create: vi.fn(),
		existsByEmail: vi.fn(),
	};
}

export function createMockPasswordService() {
	return {
		hash: vi.fn(),
		verify: vi.fn(),
	};
}

export function createMockEmailService() {
	return {
		sendWelcomeEmail: vi.fn(),
		send: vi.fn(),
	};
}

export function createMockJwtService() {
	return {
		sign: vi.fn(),
		verify: vi.fn(),
	};
}

export function createMockHonoContext(overrides?: Partial<{
	method: string;
	path: string;
	jsonBody: unknown;
	headers: Record<string, string>;
}>): Context {
	const headers = overrides?.headers ?? {};
	return {
		req: {
			method: overrides?.method ?? 'POST',
			path: overrides?.path ?? '/api/auth/login',
			json: vi.fn().mockResolvedValue(overrides?.jsonBody ?? {}),
			header: vi.fn((name: string) => headers[name]),
			query: vi.fn().mockReturnValue({}),
		},
		json: vi.fn((body, status) => {
			return { body, status };
		}),
		header: vi.fn(),
		set: vi.fn(),
		get: vi.fn(),
	} as unknown as Context;
}

export function createMockNext(): Next {
	return vi.fn().mockResolvedValue(undefined);
}

export function createMockPrismaClient() {
	return {
		user: {
			findUnique: vi.fn(),
			create: vi.fn(),
			count: vi.fn(),
		},
	};
}

export function createMockRegisterUseCase() {
	return { execute: vi.fn() };
}

export function createMockLoginUseCase() {
	return { execute: vi.fn() };
}

export function createMockLogger() {
	return {
		debug: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		child: vi.fn(),
	};
}
