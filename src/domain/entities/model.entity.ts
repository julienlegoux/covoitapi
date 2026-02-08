export type ModelEntity = {
	id: string;
	refId: number;
	name: string;
	brandRefId: number;
};

export type CreateModelData = Omit<ModelEntity, 'id' | 'refId'>;
