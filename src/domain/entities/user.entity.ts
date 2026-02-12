/**
 * @module user.entity
 * Defines the user profile domain entity and its associated types.
 * The User entity stores personal information (name, phone) and is always
 * linked to an Auth entity via {@link UserEntity.authRefId}.
 */

/**
 * Represents a user profile in the system.
 *
 * @property id - UUID primary key, used as the external identifier in API responses.
 * @property refId - Auto-incremented integer, used internally as a foreign key reference.
 * @property firstName - User's first name, null until profile is completed.
 * @property lastName - User's last name, null until profile is completed.
 * @property phone - User's phone number, null until profile is completed.
 * @property authRefId - Integer FK referencing the associated Auth record's refId.
 * @property anonymizedAt - Timestamp when the profile was anonymized (GDPR), null if active.
 * @property createdAt - Timestamp of profile creation.
 * @property updatedAt - Timestamp of last modification.
 */
export type UserEntity = {
	id: string;
	refId: number;
	firstName: string | null;
	lastName: string | null;
	phone: string | null;
	authRefId: number;
	anonymizedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
};

/**
 * Extended user entity that includes the email from the joined Auth record.
 * Used in API responses where both profile and email data are needed.
 */
export type PublicUserEntity = UserEntity & { email: string };

/**
 * Data required to create a new user profile.
 *
 * @property firstName - User's first name (nullable at registration).
 * @property lastName - User's last name (nullable at registration).
 * @property phone - User's phone number (nullable at registration).
 * @property authRefId - The refId of the associated Auth record.
 */
export type CreateUserData = {
	firstName: string | null;
	lastName: string | null;
	phone: string | null;
	authRefId: number;
};

/**
 * Partial update payload for modifying user profile fields.
 * Only firstName, lastName, and phone can be updated.
 */
export type UpdateUserData = Partial<Pick<UserEntity, 'firstName' | 'lastName' | 'phone'>>;
