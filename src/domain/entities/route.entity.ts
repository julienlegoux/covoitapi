export type RouteEntity = {
	id: string;
	dateRoute: Date;
	kms: number;
	seats: number;
	driverId: string;
	carId: string;
};

export type CreateRouteData = Omit<RouteEntity, 'id'> & {
	cityIds?: string[];
};
