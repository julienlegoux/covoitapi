/**
 * @module color.entity
 * Defines the color domain entity.
 * A Color represents a vehicle color option available in the system.
 */

/**
 * Represents a color record in the system.
 *
 * @property id - UUID primary key, used as the external identifier in API responses.
 * @property refId - Auto-incremented integer, used internally as a foreign key reference.
 * @property name - Display name of the color (e.g. "Red", "Blue").
 * @property hex - Hexadecimal color code (e.g. "#FF0000").
 */
export type ColorEntity = {
	id: string;
	refId: number;
	name: string;
	hex: string;
};
