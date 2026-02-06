export type CreatePersonInput = {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	password: string;
};

export type UpdatePersonInput = {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
};

export type PatchPersonInput = {
	phone?: string;
	email?: string;
};
