/**
 * @module car.entity
 * Defines the car domain entity and its associated types.
 * A Car represents a vehicle registered in the system, linked to a Model.
 */

/**
 * Represents a car record in the system.
 *
 * @property id - UUID primary key, used as the external identifier in API responses.
 * @property refId - Auto-incremented integer, used internally as a foreign key reference.
 * @property licensePlate - Unique vehicle license plate number.
 * @property modelRefId - Integer FK referencing the car Model's refId.
 */
export type CarEntity = {
	id: string;
	refId: number;
	licensePlate: string;
	modelRefId: number;
};

/**
 * Data required to create a new car record.
 * Excludes auto-generated fields (id, refId).
 */
export type CreateCarData = Omit<CarEntity, 'id' | 'refId'>;

/**
 * Partial update payload for modifying car fields.
 * Any subset of CreateCarData fields can be provided.
 */
export type UpdateCarData = Partial<CreateCarData>;
