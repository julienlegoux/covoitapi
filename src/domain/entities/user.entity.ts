export type UserEntity = {
	id: string;
	refId: number;
	firstName: string | null;
	lastName: string | null;
	phone: string | null;
	authRefId: number;
	anonymizedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
};

export type PublicUserEntity = UserEntity & { email: string };

export type CreateUserData = {
	firstName: string | null;
	lastName: string | null;
	phone: string | null;
	authRefId: number;
};

export type UpdateUserData = Partial<Pick<UserEntity, 'firstName' | 'lastName' | 'phone'>>;
