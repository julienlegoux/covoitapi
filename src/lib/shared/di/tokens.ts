export const TOKENS = {
	UserRepository: Symbol('UserRepository'),
	EmailService: Symbol('EmailService'),
	PasswordService: Symbol('PasswordService'),
	JwtService: Symbol('JwtService'),
	PrismaClient: Symbol('PrismaClient'),
} as const;

export type TokenKeys = keyof typeof TOKENS;
