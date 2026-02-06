export type CarEntity = {
	id: string;
	immat: string;
	modelId: string;
};

export type CreateCarData = Omit<CarEntity, 'id'>;

export type UpdateCarData = Partial<CreateCarData>;
