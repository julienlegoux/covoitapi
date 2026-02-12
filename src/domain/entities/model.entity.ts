/**
 * @module model.entity
 * Defines the car model domain entity and its associated types.
 * A Model represents a specific vehicle model (e.g. "Corolla", "308")
 * belonging to a Brand.
 */

/**
 * Represents a car model in the system.
 *
 * @property id - UUID primary key, used as the external identifier in API responses.
 * @property refId - Auto-incremented integer, used internally as a foreign key reference.
 * @property name - Display name of the model.
 * @property brandRefId - Integer FK referencing the parent Brand's refId.
 */
export type ModelEntity = {
	id: string;
	refId: number;
	name: string;
	brandRefId: number;
};

/**
 * Data required to create a new model record.
 * Excludes auto-generated fields (id, refId).
 */
export type CreateModelData = Omit<ModelEntity, 'id' | 'refId'>;
