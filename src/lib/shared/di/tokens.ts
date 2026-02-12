/**
 * @module tokens
 * Defines dependency injection tokens for the tsyringe container.
 * Each token is a unique Symbol used to register and resolve interfaces
 * without coupling to concrete implementations. Tokens are organized by
 * category: repositories, services, and infrastructure clients.
 */

/**
 * DI token registry mapping abstract interfaces to unique Symbols.
 *
 * **Repositories** — resolve to Prisma*Repository implementations:
 * - AuthRepository, UserRepository, BrandRepository, ColorRepository,
 *   CityRepository, ModelRepository, CarRepository, DriverRepository,
 *   TravelRepository, InscriptionRepository
 *
 * **Services** — resolve to infrastructure service implementations:
 * - EmailService → ResendEmailService
 * - PasswordService → ArgonPasswordService
 * - JwtService → HonoJwtService
 *
 * **Infrastructure** — resolve to client instances:
 * - PrismaClient → Configured PrismaClient with Neon adapter
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
	PrismaClient: Symbol('PrismaClient'),
} as const;

/** Union type of all token names in the TOKENS registry. */
export type TokenKeys = keyof typeof TOKENS;
