export type CityEntity = {
	id: string;
	refId: number;
	cityName: string;
	zipcode: string;
};

export type CreateCityData = Omit<CityEntity, 'id' | 'refId'>;
