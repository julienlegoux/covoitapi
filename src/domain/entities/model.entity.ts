export type ModelEntity = {
	id: string;
	name: string;
	brandId: string;
};

export type CreateModelData = Omit<ModelEntity, 'id'>;
