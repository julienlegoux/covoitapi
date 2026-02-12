/**
 * @module city-travel.entity
 * Defines the city-travel join entity.
 * CityTravel is a many-to-many association linking a city to a travel route,
 * indicating whether the city is a departure or arrival point.
 */

/**
 * Represents the association between a city and a travel route.
 *
 * @property routeRefId - Integer FK referencing the Travel (route) refId.
 * @property cityRefId - Integer FK referencing the City refId.
 * @property type - Role of the city on this route (e.g. "DEPARTURE", "ARRIVAL").
 */
export type CityTravelEntity = {
	routeRefId: number;
	cityRefId: number;
	type: string;
};
