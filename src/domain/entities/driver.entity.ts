/**
 * @module driver.entity
 * Defines the driver domain entity and its associated types.
 * A Driver represents a user who has been verified to drive and offer carpooling trips.
 * Each driver is linked to a User via {@link DriverEntity.userRefId}.
 */

/**
 * Represents a driver record in the system.
 *
 * @property id - UUID primary key, used as the external identifier in API responses.
 * @property refId - Auto-incremented integer, used internally as a foreign key reference.
 * @property driverLicense - The driver's license number.
 * @property userRefId - Integer FK referencing the associated User record's refId.
 * @property anonymizedAt - Timestamp when the driver was anonymized (GDPR), null if active.
 */
export type DriverEntity = {
	id: string;
	refId: number;
	driverLicense: string;
	userRefId: number;
	anonymizedAt: Date | null;
};

/**
 * Data required to create a new driver record.
 * Excludes auto-generated fields (id, refId) and anonymizedAt.
 */
export type CreateDriverData = Omit<DriverEntity, 'id' | 'refId' | 'anonymizedAt'>;
