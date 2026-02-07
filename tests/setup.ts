import 'reflect-metadata';
import type { Context, Next } from 'hono';
import { container } from 'tsyringe';
import { beforeEach, vi } from 'vitest';

beforeEach(() => {
	container.clearInstances();
});

// ─── Repository Mocks ───

export function createMockUserRepository() {
	return {
		findAll: vi.fn(),
		findById: vi.fn(),
		findByEmail: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
		existsByEmail: vi.fn(),
	};
}

export function createMockBrandRepository() {
	return {
		findAll: vi.fn(),
		findById: vi.fn(),
		create: vi.fn(),
		delete: vi.fn(),
	};
}

export function createMockCarRepository() {
	return {
		findAll: vi.fn(),
		findById: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
		existsByImmat: vi.fn(),
	};
}

export function createMockCityRepository() {
	return {
		findAll: vi.fn(),
		findById: vi.fn(),
		findByCityName: vi.fn(),
		create: vi.fn(),
		delete: vi.fn(),
	};
}

export function createMockModelRepository() {
	return {
		findAll: vi.fn(),
		findById: vi.fn(),
		findByNameAndBrand: vi.fn(),
		create: vi.fn(),
	};
}

export function createMockDriverRepository() {
	return {
		findByUserId: vi.fn(),
		create: vi.fn(),
	};
}

export function createMockRouteRepository() {
	return {
		findAll: vi.fn(),
		findById: vi.fn(),
		findByFilters: vi.fn(),
		create: vi.fn(),
		delete: vi.fn(),
	};
}

export function createMockInscriptionRepository() {
	return {
		findAll: vi.fn(),
		findById: vi.fn(),
		findByUserId: vi.fn(),
		findByRouteId: vi.fn(),
		create: vi.fn(),
		delete: vi.fn(),
		existsByUserAndRoute: vi.fn(),
		countByRouteId: vi.fn(),
	};
}

export function createMockColorRepository() {
	return {
		findAll: vi.fn(),
		findById: vi.fn(),
	};
}

// ─── Service Mocks ───

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

// ─── Hono Mocks ───

export function createMockHonoContext(overrides?: Partial<{
	method: string;
	path: string;
	jsonBody: unknown;
	headers: Record<string, string>;
	params: Record<string, string>;
	queryParams: Record<string, string>;
}>): Context {
	const headers = overrides?.headers ?? {};
	const params = overrides?.params ?? {};
	const queryParams = overrides?.queryParams ?? {};
	return {
		req: {
			method: overrides?.method ?? 'POST',
			path: overrides?.path ?? '/api/auth/login',
			json: vi.fn().mockResolvedValue(overrides?.jsonBody ?? {}),
			header: vi.fn((name: string) => headers[name]),
			param: vi.fn((name: string) => params[name]),
			query: vi.fn((name?: string) => name ? queryParams[name] : queryParams),
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

// ─── Use Case Mocks ───

export function createMockRegisterUseCase() {
	return { execute: vi.fn() };
}

export function createMockLoginUseCase() {
	return { execute: vi.fn() };
}

export function createMockListBrandsUseCase() {
	return { execute: vi.fn() };
}

export function createMockCreateBrandUseCase() {
	return { execute: vi.fn() };
}

export function createMockDeleteBrandUseCase() {
	return { execute: vi.fn() };
}

export function createMockListCarsUseCase() {
	return { execute: vi.fn() };
}

export function createMockCreateCarUseCase() {
	return { execute: vi.fn() };
}

export function createMockUpdateCarUseCase() {
	return { execute: vi.fn() };
}

export function createMockDeleteCarUseCase() {
	return { execute: vi.fn() };
}

export function createMockListCitiesUseCase() {
	return { execute: vi.fn() };
}

export function createMockCreateCityUseCase() {
	return { execute: vi.fn() };
}

export function createMockDeleteCityUseCase() {
	return { execute: vi.fn() };
}

export function createMockListInscriptionsUseCase() {
	return { execute: vi.fn() };
}

export function createMockListUserInscriptionsUseCase() {
	return { execute: vi.fn() };
}

export function createMockListRoutePassengersUseCase() {
	return { execute: vi.fn() };
}

export function createMockCreateInscriptionUseCase() {
	return { execute: vi.fn() };
}

export function createMockDeleteInscriptionUseCase() {
	return { execute: vi.fn() };
}

export function createMockListPersonsUseCase() {
	return { execute: vi.fn() };
}

export function createMockGetPersonUseCase() {
	return { execute: vi.fn() };
}

export function createMockCreatePersonUseCase() {
	return { execute: vi.fn() };
}

export function createMockUpdatePersonUseCase() {
	return { execute: vi.fn() };
}

export function createMockDeletePersonUseCase() {
	return { execute: vi.fn() };
}

export function createMockListRoutesUseCase() {
	return { execute: vi.fn() };
}

export function createMockGetRouteUseCase() {
	return { execute: vi.fn() };
}

export function createMockFindRouteUseCase() {
	return { execute: vi.fn() };
}

export function createMockCreateRouteUseCase() {
	return { execute: vi.fn() };
}

export function createMockDeleteRouteUseCase() {
	return { execute: vi.fn() };
}

// ─── Logger Mock ───

export function createMockLogger() {
	return {
		debug: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		child: vi.fn(),
	};
}
