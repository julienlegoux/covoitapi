export type UserEntity = {
	id: string;
	email: string;
	password: string;
	firstName?: string;
	lastName?: string;
	phone?: string;
	role: string;
	anonymizedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
};

export type PublicUserEntity = Omit<UserEntity, 'password'>;

export type CreateUserData = Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt' | 'anonymizedAt'>;

export type UpdateUserData = Partial<Pick<UserEntity, 'firstName' | 'lastName' | 'email' | 'phone'>>;
