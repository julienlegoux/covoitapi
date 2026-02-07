export const TOKENS = {
	UserRepository: Symbol('UserRepository'),
	BrandRepository: Symbol('BrandRepository'),
	ColorRepository: Symbol('ColorRepository'),
	CityRepository: Symbol('CityRepository'),
	ModelRepository: Symbol('ModelRepository'),
	CarRepository: Symbol('CarRepository'),
	DriverRepository: Symbol('DriverRepository'),
	RouteRepository: Symbol('RouteRepository'),
	InscriptionRepository: Symbol('InscriptionRepository'),
	EmailService: Symbol('EmailService'),
	PasswordService: Symbol('PasswordService'),
	JwtService: Symbol('JwtService'),
	PrismaClient: Symbol('PrismaClient'),
} as const;

export type TokenKeys = keyof typeof TOKENS;
