export type JwtPayload = {
	userId: string;
};

export interface JwtService {
	sign(payload: JwtPayload): Promise<string>;
	verify(token: string): Promise<JwtPayload | null>;
}
