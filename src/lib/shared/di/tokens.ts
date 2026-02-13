/**
 * @module tokens
 * Defines dependency injection tokens for the tsyringe container.
 * Each token is a unique Symbol used to register and resolve interfaces
 * without coupling to concrete implementations. Tokens are organized by
 * category: repositories, services, and infrastructure clients.
 *
 * Two token sets exist for repositories:
 * - PRISMA_TOKENS: resolve to raw PrismaXRepository implementations (inner, DB-only)
 * - TOKENS: resolve to CachedXRepository decorators (outer, public-facing)
 *
 * Use cases and controllers should always inject via TOKENS.
 * PRISMA_TOKENS are only used internally by cached repository decorators.
 */

/**
 * Prisma-specific DI tokens mapping to raw database repository implementations.
 * Used internally by CachedXRepository decorators to inject the inner Prisma repo.
 * Use cases should NEVER resolve these tokens directly; they resolve via TOKENS.
 */
export const PRISMA_TOKENS = {
	AuthRepository: Symbol('PrismaAuthRepository'),
	UserRepository: Symbol('PrismaUserRepository'),
	BrandRepository: Symbol('PrismaBrandRepository'),
	ColorRepository: Symbol('PrismaColorRepository'),
	CityRepository: Symbol('PrismaCityRepository'),
	ModelRepository: Symbol('PrismaModelRepository'),
	CarRepository: Symbol('PrismaCarRepository'),
	DriverRepository: Symbol('PrismaDriverRepository'),
	TravelRepository: Symbol('PrismaTravelRepository'),
	InscriptionRepository: Symbol('PrismaInscriptionRepository'),
} as const;

/**
 * DI token registry mapping abstract interfaces to unique Symbols.
 *
 * **Repositories** — resolve to CachedXRepository decorators (wrapping PrismaXRepository):
 * - AuthRepository, UserRepository, BrandRepository, ColorRepository,
 *   CityRepository, ModelRepository, CarRepository, DriverRepository,
 *   TravelRepository, InscriptionRepository
 *
 * **Services** — resolve to infrastructure service implementations:
 * - EmailService → ResendEmailService
 * - PasswordService → ArgonPasswordService
 * - JwtService → HonoJwtService
 * - CacheService → UpstashCacheService
 *
 * **Infrastructure** — resolve to client instances:
 * - PrismaClient → Configured PrismaClient with Neon adapter
 * - CacheConfig → Cache configuration with per-domain TTLs
 */
export const TOKENS = {
	AuthRepository: Symbol('AuthRepository'),
	UserRepository: Symbol('UserRepository'),
	BrandRepository: Symbol('BrandRepository'),
	ColorRepository: Symbol('ColorRepository'),
	CityRepository: Symbol('CityRepository'),
	ModelRepository: Symbol('ModelRepository'),
	CarRepository: Symbol('CarRepository'),
	DriverRepository: Symbol('DriverRepository'),
	TravelRepository: Symbol('TravelRepository'),
	InscriptionRepository: Symbol('InscriptionRepository'),
	EmailService: Symbol('EmailService'),
	PasswordService: Symbol('PasswordService'),
	JwtService: Symbol('JwtService'),
	CacheService: Symbol('CacheService'),
	PrismaClient: Symbol('PrismaClient'),
	CacheConfig: Symbol('CacheConfig'),
	Logger: Symbol('Logger'),
} as const;

/** Union type of all token names in the TOKENS registry. */
export type TokenKeys = keyof typeof TOKENS;

/** Union type of all token names in the PRISMA_TOKENS registry. */
export type PrismaTokenKeys = keyof typeof PRISMA_TOKENS;
