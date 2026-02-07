export type CityEntity = {
	id: string;
	cityName: string;
	zipcode: string;
};

export type CreateCityData = Omit<CityEntity, 'id'>;
