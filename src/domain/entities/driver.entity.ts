export type DriverEntity = {
	id: string;
	driverLicense: string;
	userId: string;
	anonymizedAt: Date | null;
};

export type CreateDriverData = Omit<DriverEntity, 'id' | 'anonymizedAt'>;
