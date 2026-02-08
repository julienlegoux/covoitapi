export type UserEntity = {
	id: string;
	email: string;
	password: string;
	firstName: string | null;
	lastName: string | null;
	phone: string | null;
	role: string;
	anonymizedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
};

export type PublicUserEntity = Omit<UserEntity, 'password'>;

export type CreateUserData = Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt' | 'anonymizedAt' | 'role'>;

export type UpdateUserData = Partial<Pick<UserEntity, 'firstName' | 'lastName' | 'email' | 'phone'>>;
