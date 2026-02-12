/**
 * @module brand.entity
 * Defines the car brand domain entity and its associated types.
 * A Brand represents a vehicle manufacturer (e.g. "Toyota", "Peugeot").
 */

/**
 * Represents a car brand (manufacturer) in the system.
 *
 * @property id - UUID primary key, used as the external identifier in API responses.
 * @property refId - Auto-incremented integer, used internally as a foreign key reference.
 * @property name - Display name of the brand.
 */
export type BrandEntity = {
	id: string;
	refId: number;
	name: string;
};

/**
 * Data required to create a new brand record.
 * Excludes auto-generated fields (id, refId).
 */
export type CreateBrandData = Omit<BrandEntity, 'id' | 'refId'>;
