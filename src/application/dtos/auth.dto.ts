export type RegisterInput = {
	email: string;
	password: string;
	confirmPassword: string;
};

export type LoginInput = {
	email: string;
	password: string;
};

export type AuthResponse = {
	userId: string;
	token: string;
};
