export type DriverEntity = {
	id: string;
	refId: number;
	driverLicense: string;
	userRefId: number;
	anonymizedAt: Date | null;
};

export type CreateDriverData = Omit<DriverEntity, 'id' | 'refId' | 'anonymizedAt'>;
