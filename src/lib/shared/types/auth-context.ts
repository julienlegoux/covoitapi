/**
 * @module auth-context
 * Utility type for adding authentication context to input types.
 * Used by use cases that require the authenticated user's ID alongside their input data.
 */

/**
 * Intersects a type T with the authenticated user's ID.
 * Used to augment use-case input types with the userId from the auth middleware.
 *
 * @template T - The base type to extend with auth context.
 * @property userId - The UUID of the authenticated user (set by auth middleware).
 */
export type WithAuthContext<T> = T & {
	userId: string;
};
