export type BrandEntity = {
	id: string;
	name: string;
};

export type CreateBrandData = Omit<BrandEntity, 'id'>;
