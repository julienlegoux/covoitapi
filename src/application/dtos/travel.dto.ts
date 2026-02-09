export type CreateTravelInput = {
	kms: number;
	userId: string;
	date: string;
	departureCity: string;
	arrivalCity: string;
	seats: number;
	carId: string;
};

export type FindTravelInput = {
	departureCity?: string;
	arrivalCity?: string;
	date?: string;
};
