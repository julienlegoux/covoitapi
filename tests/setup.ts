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
		findByAuthRefId: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
		anonymize: vi.fn(),
	};
}

export function createMockAuthRepository() {
	return {
		findByEmail: vi.fn(),
		createWithUser: vi.fn(),
		existsByEmail: vi.fn(),
		updateRole: vi.fn(),
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
		findByUserRefId: vi.fn(),
		create: vi.fn(),
	};
}

export function createMockTravelRepository() {
	return {
		findAll: vi.fn(),
		findById: vi.fn(),
		findByFilters: vi.fn(),
		create: vi.fn(),
		delete: vi.fn(),
	};
}

/** @deprecated Use createMockTravelRepository instead. Kept for backward compatibility. */
export const createMockRouteRepository = createMockTravelRepository;

export function createMockInscriptionRepository() {
	return {
		findAll: vi.fn(),
		findById: vi.fn(),
		findByUserRefId: vi.fn(),
		findByRouteRefId: vi.fn(),
		create: vi.fn(),
		delete: vi.fn(),
		existsByUserAndRoute: vi.fn(),
		countByRouteRefId: vi.fn(),
	};
}

export function createMockColorRepository() {
	return {
		findAll: vi.fn(),
		findById: vi.fn(),
		findByName: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
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
			findMany: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			count: vi.fn(),
		},
		auth: {
			findUnique: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
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

export function createMockListTravelsUseCase() {
	return { execute: vi.fn() };
}

export function createMockGetTravelUseCase() {
	return { execute: vi.fn() };
}

export function createMockFindTravelUseCase() {
	return { execute: vi.fn() };
}

export function createMockCreateTravelUseCase() {
	return { execute: vi.fn() };
}

export function createMockDeleteTravelUseCase() {
	return { execute: vi.fn() };
}

/** @deprecated Use createMockListTravelsUseCase instead. */
export const createMockListRoutesUseCase = createMockListTravelsUseCase;
/** @deprecated Use createMockGetTravelUseCase instead. */
export const createMockGetRouteUseCase = createMockGetTravelUseCase;
/** @deprecated Use createMockFindTravelUseCase instead. */
export const createMockFindRouteUseCase = createMockFindTravelUseCase;
/** @deprecated Use createMockCreateTravelUseCase instead. */
export const createMockCreateRouteUseCase = createMockCreateTravelUseCase;
/** @deprecated Use createMockDeleteTravelUseCase instead. */
export const createMockDeleteRouteUseCase = createMockDeleteTravelUseCase;

export function createMockListColorsUseCase() {
	return { execute: vi.fn() };
}

export function createMockCreateColorUseCase() {
	return { execute: vi.fn() };
}

export function createMockUpdateColorUseCase() {
	return { execute: vi.fn() };
}

export function createMockDeleteColorUseCase() {
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

// ─── Entity Data Factories ───

export function createMockUserData(overrides?: Partial<{
	id: string;
	refId: number;
	authRefId: number;
	firstName: string | null;
	lastName: string | null;
	phone: string | null;
	email: string;
	anonymizedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
}>) {
	return {
		id: overrides?.id ?? 'user-id-1',
		refId: overrides?.refId ?? 1,
		authRefId: overrides?.authRefId ?? 1,
		firstName: overrides?.firstName !== undefined ? overrides.firstName : 'John',
		lastName: overrides?.lastName !== undefined ? overrides.lastName : 'Doe',
		phone: overrides?.phone !== undefined ? overrides.phone : '0612345678',
		email: overrides?.email ?? 'test@example.com',
		anonymizedAt: overrides?.anonymizedAt ?? null,
		createdAt: overrides?.createdAt ?? new Date('2025-01-01'),
		updatedAt: overrides?.updatedAt ?? new Date('2025-01-01'),
	};
}

export function createMockDriverData(overrides?: Partial<{
	id: string;
	refId: number;
	driverLicense: string;
	userRefId: number;
	anonymizedAt: Date | null;
}>) {
	return {
		id: overrides?.id ?? 'driver-id-1',
		refId: overrides?.refId ?? 1,
		driverLicense: overrides?.driverLicense ?? 'DL-123456',
		userRefId: overrides?.userRefId ?? 1,
		anonymizedAt: overrides?.anonymizedAt ?? null,
	};
}

export function createMockInscriptionData(overrides?: Partial<{
	id: string;
	refId: number;
	createdAt: Date;
	userRefId: number;
	routeRefId: number;
	status: string;
}>) {
	return {
		id: overrides?.id ?? 'inscription-id-1',
		refId: overrides?.refId ?? 1,
		createdAt: overrides?.createdAt ?? new Date('2025-01-01'),
		userRefId: overrides?.userRefId ?? 1,
		routeRefId: overrides?.routeRefId ?? 1,
		status: overrides?.status ?? 'ACTIVE',
	};
}

export function createMockTravelData(overrides?: Partial<{
	id: string;
	refId: number;
	dateRoute: Date;
	kms: number;
	seats: number;
	driverRefId: number;
	carRefId: number;
}>) {
	return {
		id: overrides?.id ?? 'travel-id-1',
		refId: overrides?.refId ?? 1,
		dateRoute: overrides?.dateRoute ?? new Date('2025-06-01'),
		kms: overrides?.kms ?? 100,
		seats: overrides?.seats ?? 3,
		driverRefId: overrides?.driverRefId ?? 1,
		carRefId: overrides?.carRefId ?? 1,
	};
}

/** @deprecated Use createMockTravelData instead. Kept for backward compatibility. */
export const createMockRouteData = createMockTravelData;
