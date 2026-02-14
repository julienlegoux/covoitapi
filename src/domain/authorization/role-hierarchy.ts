/**
 * @module RoleHierarchy
 * Defines the role hierarchy used for authorization decisions.
 * Higher numeric values indicate greater privileges.
 * A user with a higher-level role can access endpoints requiring lower-level roles.
 */

export const ROLE_HIERARCHY: Record<string, number> = {
	USER: 1,
	DRIVER: 2,
	ADMIN: 3,
};
