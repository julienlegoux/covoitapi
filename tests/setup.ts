import 'reflect-metadata';
import type { Context, Next } from 'hono';
import { container } from 'tsyringe';
import { beforeEach, vi } from 'vitest';
import { TOKENS } from '../src/lib/shared/di/tokens.js';

beforeEach(() => {
	container.clearInstances();
	container.registerInstance(TOKENS.Logger, createMockLogger());
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
		existsByLicensePlate: vi.fn(),
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
		findByUserId: vi.fn(),
		create: vi.fn(),
	};
}

export function createMockTripRepository() {
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
		findByUserRefId: vi.fn(),
		findByTripRefId: vi.fn(),
		findByUserId: vi.fn(),
		findByTripId: vi.fn(),
		findByIdAndUserId: vi.fn(),
		create: vi.fn(),
		delete: vi.fn(),
		existsByUserAndTrip: vi.fn(),
		countByTripRefId: vi.fn(),
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

// ─── Cache Mocks ───

export function createMockCacheService() {
	return {
		get: vi.fn().mockResolvedValue(null),
		set: vi.fn().mockResolvedValue(undefined),
		delete: vi.fn().mockResolvedValue(undefined),
		deleteByPattern: vi.fn().mockResolvedValue(undefined),
		isHealthy: vi.fn().mockResolvedValue(true),
	};
}

export function createMockCacheConfig(overrides?: Partial<{
	enabled: boolean;
	keyPrefix: string;
	ttl: Partial<Record<string, number>>;
}>) {
	return {
		enabled: overrides?.enabled ?? true,
		keyPrefix: overrides?.keyPrefix ?? 'test:',
		ttl: {
			brand: 3600,
			color: 3600,
			model: 1800,
			city: 1800,
			car: 600,
			driver: 600,
			user: 300,
			auth: 300,
			trip: 300,
			inscription: 120,
			...overrides?.ttl,
		},
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
			path: overrides?.path ?? '/api/v1/auth/login',
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
		car: {
			findUnique: vi.fn(),
			findMany: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			count: vi.fn(),
		},
		brand: {
			findUnique: vi.fn(),
			findMany: vi.fn(),
			create: vi.fn(),
			delete: vi.fn(),
			count: vi.fn(),
		},
		city: {
			findUnique: vi.fn(),
			findMany: vi.fn(),
			create: vi.fn(),
			delete: vi.fn(),
			count: vi.fn(),
		},
		color: {
			findUnique: vi.fn(),
			findMany: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			count: vi.fn(),
		},
		driver: {
			findUnique: vi.fn(),
			findFirst: vi.fn(),
			create: vi.fn(),
			count: vi.fn(),
		},
		inscription: {
			findUnique: vi.fn(),
			findFirst: vi.fn(),
			findMany: vi.fn(),
			create: vi.fn(),
			delete: vi.fn(),
			count: vi.fn(),
		},
		trip: {
			findUnique: vi.fn(),
			findMany: vi.fn(),
			create: vi.fn(),
			delete: vi.fn(),
			count: vi.fn(),
		},
		model: {
			findUnique: vi.fn(),
			findMany: vi.fn(),
			create: vi.fn(),
			count: vi.fn(),
		},
		$transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) => fn({
			auth: { create: vi.fn(), findUnique: vi.fn() },
			user: { create: vi.fn(), findUnique: vi.fn() },
		})),
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

export function createMockListTripPassengersUseCase() {
	return { execute: vi.fn() };
}

export function createMockCreateInscriptionUseCase() {
	return { execute: vi.fn() };
}

export function createMockDeleteInscriptionUseCase() {
	return { execute: vi.fn() };
}

export function createMockListTripsUseCase() {
	return { execute: vi.fn() };
}

export function createMockGetTripUseCase() {
	return { execute: vi.fn() };
}

export function createMockFindTripUseCase() {
	return { execute: vi.fn() };
}

export function createMockCreateTripUseCase() {
	return { execute: vi.fn() };
}

export function createMockDeleteTripUseCase() {
	return { execute: vi.fn() };
}

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
	const mockLogger = {
		debug: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		child: vi.fn(),
	};
	mockLogger.child.mockReturnValue(mockLogger);
	return mockLogger;
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
		firstName: overrides?.firstName === undefined ? 'John' : overrides.firstName,
		lastName: overrides?.lastName === undefined ? 'Doe' : overrides.lastName,
		phone: overrides?.phone === undefined ? '0612345678' : overrides.phone,
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
	tripRefId: number;
	status: string;
}>) {
	return {
		id: overrides?.id ?? 'inscription-id-1',
		refId: overrides?.refId ?? 1,
		createdAt: overrides?.createdAt ?? new Date('2025-01-01'),
		userRefId: overrides?.userRefId ?? 1,
		tripRefId: overrides?.tripRefId ?? 1,
		status: overrides?.status ?? 'ACTIVE',
	};
}

export function createMockTripData(overrides?: Partial<{
	id: string;
	refId: number;
	dateTrip: Date;
	kms: number;
	seats: number;
	driverRefId: number;
	carRefId: number;
}>) {
	return {
		id: overrides?.id ?? 'trip-id-1',
		refId: overrides?.refId ?? 1,
		dateTrip: overrides?.dateTrip ?? new Date('2025-06-01'),
		kms: overrides?.kms ?? 100,
		seats: overrides?.seats ?? 3,
		driverRefId: overrides?.driverRefId ?? 1,
		carRefId: overrides?.carRefId ?? 1,
	};
}
