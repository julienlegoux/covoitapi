/**
 * @module inscription.entity
 * Defines the inscription (booking) domain entity and its associated types.
 * An Inscription represents a passenger's registration for a specific trip.
 */

/**
 * Represents a passenger inscription (booking) for a carpooling trip.
 *
 * @property id - UUID primary key, used as the external identifier in API responses.
 * @property refId - Auto-incremented integer, used internally as a foreign key reference.
 * @property createdAt - Timestamp when the inscription was created.
 * @property userRefId - Integer FK referencing the passenger's User refId.
 * @property tripRefId - Integer FK referencing the Trip refId.
 * @property status - Current status of the inscription (e.g. "PENDING", "CONFIRMED", "CANCELLED").
 */
export type InscriptionEntity = {
	id: string;
	refId: number;
	createdAt: Date;
	userRefId: number;
	tripRefId: number;
	status: string;
};

/**
 * Data required to create a new inscription.
 * Only the user and trip references are needed; status defaults on creation.
 */
export type CreateInscriptionData = Pick<InscriptionEntity, 'userRefId' | 'tripRefId'>;
