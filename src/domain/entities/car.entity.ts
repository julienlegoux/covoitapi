export type CarEntity = {
	id: string;
	refId: number;
	licensePlate: string;
	modelRefId: number;
};

export type CreateCarData = Omit<CarEntity, 'id' | 'refId'>;

export type UpdateCarData = Partial<CreateCarData>;
