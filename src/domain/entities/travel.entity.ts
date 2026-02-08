export type TravelEntity = {
	id: string;
	dateRoute: Date;
	kms: number;
	seats: number;
	driverId: string;
	carId: string;
};

export type CreateTravelData = Omit<TravelEntity, 'id'> & {
	cityIds?: string[];
};
