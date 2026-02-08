export type BrandEntity = {
	id: string;
	refId: number;
	name: string;
};

export type CreateBrandData = Omit<BrandEntity, 'id' | 'refId'>;
