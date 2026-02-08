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
		updateRole: vi.fn(),
		delete: vi.fn(),
		existsByEmail: vi.fn(),
		anonymize: vi.fn(),
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

// ─── User Use Case Mocks (aliases for Person mocks) ───

/** @deprecated Use createMockListPersonsUseCase. Alias kept for consistency with User naming. */
export const createMockListUsersUseCase = createMockListPersonsUseCase;
/** @deprecated Use createMockGetPersonUseCase. Alias kept for consistency with User naming. */
export const createMockGetUserUseCase = createMockGetPersonUseCase;
/** @deprecated Use createMockCreatePersonUseCase. Alias kept for consistency with User naming. */
export const createMockCreateUserUseCase = createMockCreatePersonUseCase;
/** @deprecated Use createMockUpdatePersonUseCase. Alias kept for consistency with User naming. */
export const createMockUpdateUserUseCase = createMockUpdatePersonUseCase;
/** @deprecated Use createMockDeletePersonUseCase. Alias kept for consistency with User naming. */
export const createMockDeleteUserUseCase = createMockDeletePersonUseCase;

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
	email: string;
	password: string;
	firstName: string | undefined;
	lastName: string | undefined;
	phone: string | undefined;
	role: string;
	anonymizedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
}>) {
	return {
		id: overrides?.id ?? 'user-id-1',
		email: overrides?.email ?? 'test@example.com',
		password: overrides?.password ?? 'hashed-password',
		firstName: overrides?.firstName !== undefined ? overrides.firstName : 'John',
		lastName: overrides?.lastName !== undefined ? overrides.lastName : 'Doe',
		phone: overrides?.phone !== undefined ? overrides.phone : '0612345678',
		role: overrides?.role ?? 'USER',
		anonymizedAt: overrides?.anonymizedAt ?? null,
		createdAt: overrides?.createdAt ?? new Date('2025-01-01'),
		updatedAt: overrides?.updatedAt ?? new Date('2025-01-01'),
	};
}

export function createMockDriverData(overrides?: Partial<{
	id: string;
	driverLicense: string;
	userId: string;
	anonymizedAt: Date | null;
}>) {
	return {
		id: overrides?.id ?? 'driver-id-1',
		driverLicense: overrides?.driverLicense ?? 'DL-123456',
		userId: overrides?.userId ?? 'user-id-1',
		anonymizedAt: overrides?.anonymizedAt ?? null,
	};
}

export function createMockInscriptionData(overrides?: Partial<{
	id: string;
	createdAt: Date;
	userId: string;
	routeId: string;
	status: string;
}>) {
	return {
		id: overrides?.id ?? 'inscription-id-1',
		createdAt: overrides?.createdAt ?? new Date('2025-01-01'),
		userId: overrides?.userId ?? 'user-id-1',
		routeId: overrides?.routeId ?? 'route-id-1',
		status: overrides?.status ?? 'ACTIVE',
	};
}

export function createMockTravelData(overrides?: Partial<{
	id: string;
	dateRoute: Date;
	kms: number;
	seats: number;
	driverId: string;
	carId: string;
}>) {
	return {
		id: overrides?.id ?? 'travel-id-1',
		dateRoute: overrides?.dateRoute ?? new Date('2025-06-01'),
		kms: overrides?.kms ?? 100,
		seats: overrides?.seats ?? 3,
		driverId: overrides?.driverId ?? 'driver-id-1',
		carId: overrides?.carId ?? 'car-id-1',
	};
}

/** @deprecated Use createMockTravelData instead. Kept for backward compatibility. */
export const createMockRouteData = createMockTravelData;
