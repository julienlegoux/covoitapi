export type TravelEntity = {
	id: string;
	refId: number;
	dateRoute: Date;
	kms: number;
	seats: number;
	driverRefId: number;
	carRefId: number;
};

export type CreateTravelData = Omit<TravelEntity, 'id' | 'refId'> & {
	cityRefIds?: number[];
};
