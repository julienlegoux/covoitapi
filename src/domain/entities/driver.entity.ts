export type DriverEntity = {
	id: string;
	driverLicense: string;
	userId: string;
};

export type CreateDriverData = Omit<DriverEntity, 'id'>;
