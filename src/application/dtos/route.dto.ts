export type CreateRouteInput = {
	kms: number;
	idpers: string;
	dateT: string;
	villeD: string;
	villeA: string;
	seats: number;
	carId: string;
};

export type FindRouteInput = {
	villeD?: string;
	villeA?: string;
	dateT?: string;
};
