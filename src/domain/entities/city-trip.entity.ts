/**
 * @module city-trip.entity
 * Defines the city-trip join entity.
 * CityTrip is a many-to-many association linking a city to a trip,
 * indicating whether the city is a departure or arrival point.
 */

/**
 * Represents the association between a city and a trip.
 *
 * @property tripRefId - Integer FK referencing the Trip refId.
 * @property cityRefId - Integer FK referencing the City refId.
 * @property type - Role of the city on this trip (e.g. "DEPARTURE", "ARRIVAL").
 */
export type CityTripEntity = {
    tripRefId: number;
    cityRefId: number;
    type: string;
};
