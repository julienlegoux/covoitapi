/**
 * @module city.entity
 * Defines the city domain entity and its associated types.
 * A City represents a geographical location that can serve as a departure
 * or arrival point on a carpooling route.
 */

/**
 * Represents a city record in the system.
 *
 * @property id - UUID primary key, used as the external identifier in API responses.
 * @property refId - Auto-incremented integer, used internally as a foreign key reference.
 * @property cityName - Display name of the city.
 * @property zipcode - Postal/zip code of the city.
 */
export type CityEntity = {
	id: string;
	refId: number;
	cityName: string;
	zipcode: string;
};

/**
 * Data required to create a new city record.
 * Excludes auto-generated fields (id, refId).
 */
export type CreateCityData = Omit<CityEntity, 'id' | 'refId'>;
