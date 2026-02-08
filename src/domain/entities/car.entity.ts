export type CarEntity = {
	id: string;
	refId: number;
	immat: string;
	modelRefId: number;
};

export type CreateCarData = Omit<CarEntity, 'id' | 'refId'>;

export type UpdateCarData = Partial<CreateCarData>;
