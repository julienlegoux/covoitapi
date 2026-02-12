/**
 * @module auth.entity
 * Defines the authentication domain entity and its associated types.
 * Auth owns the user's credentials (email, password) and role,
 * kept separate from the User profile entity for security isolation.
 */

/**
 * Represents an authentication record in the system.
 *
 * @property id - UUID primary key, used as the external identifier in API responses.
 * @property refId - Auto-incremented integer, used internally as a foreign key reference.
 * @property email - Unique email address serving as the login credential.
 * @property password - Argon2-hashed password (never exposed publicly).
 * @property role - User role (e.g. "USER", "ADMIN") controlling authorization.
 * @property anonymizedAt - Timestamp when the account was anonymized (GDPR), null if active.
 * @property createdAt - Timestamp of account creation.
 * @property updatedAt - Timestamp of last modification.
 */
export type AuthEntity = {
	id: string;
	refId: number;
	email: string;
	password: string;
	role: string;
	anonymizedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
};

/**
 * Public-safe projection of AuthEntity with the password field omitted.
 * Used when auth data needs to be included in API responses.
 */
export type PublicAuthEntity = Omit<AuthEntity, 'password'>;

/**
 * Data required to create a new authentication record.
 *
 * @property email - The user's email address.
 * @property password - The plain-text password (will be hashed before storage).
 */
export type CreateAuthData = {
	email: string;
	password: string;
};
