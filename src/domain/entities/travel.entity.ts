/**
 * @module travel.entity
 * Defines the travel (carpooling trip) domain entity and its associated types.
 * A Travel represents a scheduled ride offered by a driver with a specific car,
 * including route distance, available seats, and associated cities.
 */

/**
 * Represents a carpooling trip in the system.
 *
 * @property id - UUID primary key, used as the external identifier in API responses.
 * @property refId - Auto-incremented integer, used internally as a foreign key reference.
 * @property dateRoute - Scheduled date and time of the trip.
 * @property kms - Distance of the trip in kilometers.
 * @property seats - Total number of available passenger seats.
 * @property driverRefId - Integer FK referencing the Driver record's refId.
 * @property carRefId - Integer FK referencing the Car record's refId.
 */
export type TravelEntity = {
	id: string;
	refId: number;
	dateRoute: Date;
	kms: number;
	seats: number;
	driverRefId: number;
	carRefId: number;
};

/**
 * Data required to create a new travel record.
 * Excludes auto-generated fields (id, refId) and optionally includes city associations.
 *
 * @property cityRefIds - Optional array of City refIds to link as stops on this route.
 */
export type CreateTravelData = Omit<TravelEntity, 'id' | 'refId'> & {
	cityRefIds?: number[];
};
