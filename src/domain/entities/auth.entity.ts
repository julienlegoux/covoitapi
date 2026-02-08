export type AuthEntity = {
	id: string;
	refId: number;
	email: string;
	password: string;
	role: string;
	anonymizedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
};

export type PublicAuthEntity = Omit<AuthEntity, 'password'>;

export type CreateAuthData = {
	email: string;
	password: string;
};
