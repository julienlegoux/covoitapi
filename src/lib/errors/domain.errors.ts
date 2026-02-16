/**
 * @module domain.errors
 * Defines all domain-level error classes.
 * Domain errors represent business logic violations (e.g. entity not found,
 * duplicate resources, capacity exceeded). They are distinct from infrastructure errors
 * and map to 4xx HTTP status codes via the error registry.
 */

/**
 * Base class for all domain-level errors (business logic violations).
 *
 * @extends Error
 * @property code - Machine-readable error code matching the ErrorCodes registry.
 */
export class DomainError extends Error {
	constructor(
		message: string,
		public readonly code: string,
	) {
		super(message);
		this.name = 'DomainError';
	}
}

/**
 * Thrown when attempting to register with an email that already exists.
 * @param email - The duplicate email address.
 */
export class UserAlreadyExistsError extends DomainError {
	constructor(email: string) {
		super(`A user with email "${email}" already exists`, 'USER_ALREADY_EXISTS');
		this.name = 'UserAlreadyExistsError';
	}
}

/**
 * Thrown when login credentials (email or password) are incorrect.
 */
export class InvalidCredentialsError extends DomainError {
	constructor() {
		super('Invalid email or password', 'INVALID_CREDENTIALS');
		this.name = 'InvalidCredentialsError';
	}
}

/**
 * Thrown when a user cannot be found by the given identifier.
 * @param identifier - The UUID or other identifier used in the lookup.
 */
export class UserNotFoundError extends DomainError {
	constructor(identifier: string) {
		super(`User not found: ${identifier}`, 'USER_NOT_FOUND');
		this.name = 'UserNotFoundError';
	}
}

/**
 * Thrown when a brand cannot be found by the given identifier.
 * @param identifier - The UUID or other identifier used in the lookup.
 */
export class BrandNotFoundError extends DomainError {
	constructor(identifier: string) {
		super(`Brand not found: ${identifier}`, 'BRAND_NOT_FOUND');
		this.name = 'BrandNotFoundError';
	}
}

/**
 * Thrown when a city cannot be found by the given identifier.
 * @param identifier - The UUID or other identifier used in the lookup.
 */
export class CityNotFoundError extends DomainError {
	constructor(identifier: string) {
		super(`City not found: ${identifier}`, 'CITY_NOT_FOUND');
		this.name = 'CityNotFoundError';
	}
}

/**
 * Thrown when a car cannot be found by the given identifier.
 * @param identifier - The UUID or other identifier used in the lookup.
 */
export class CarNotFoundError extends DomainError {
	constructor(identifier: string) {
		super(`Car not found: ${identifier}`, 'CAR_NOT_FOUND');
		this.name = 'CarNotFoundError';
	}
}

/**
 * Thrown when attempting to register a car with a license plate that already exists.
 * @param licensePlate - The duplicate license plate.
 */
export class CarAlreadyExistsError extends DomainError {
	constructor(licensePlate: string) {
		super(`A car with license plate "${licensePlate}" already exists`, 'CAR_ALREADY_EXISTS');
		this.name = 'CarAlreadyExistsError';
	}
}

/**
 * Thrown when a driver cannot be found by the given identifier.
 * @param identifier - The UUID or other identifier used in the lookup.
 */
export class DriverNotFoundError extends DomainError {
	constructor(identifier: string) {
		super(`Driver not found: ${identifier}`, 'DRIVER_NOT_FOUND');
		this.name = 'DriverNotFoundError';
	}
}

/**
 * Thrown when attempting to create a driver for a user who is already a driver.
 * @param userId - The UUID of the user who already has a driver record.
 */
export class DriverAlreadyExistsError extends DomainError {
	constructor(userId: string) {
		super(`A driver already exists for user "${userId}"`, 'DRIVER_ALREADY_EXISTS');
		this.name = 'DriverAlreadyExistsError';
	}
}

/**
 * Thrown when a trip cannot be found by the given identifier.
 * @param identifier - The UUID or other identifier used in the lookup.
 */
export class TripNotFoundError extends DomainError {
	constructor(identifier: string) {
		super(`Trip not found: ${identifier}`, 'TRIP_NOT_FOUND');
		this.name = 'TripNotFoundError';
	}
}

/**
 * Thrown when an inscription cannot be found by the given identifier.
 * @param identifier - The UUID or other identifier used in the lookup.
 */
export class InscriptionNotFoundError extends DomainError {
	constructor(identifier: string) {
		super(`Inscription not found: ${identifier}`, 'INSCRIPTION_NOT_FOUND');
		this.name = 'InscriptionNotFoundError';
	}
}

/**
 * Thrown when a user attempts to inscribe on a trip they are already registered for.
 * @param userId - The UUID of the user.
 * @param tripId - The UUID of the trip.
 */
export class AlreadyInscribedError extends DomainError {
	constructor(userId: string, tripId: string) {
		super(`User ${userId} is already inscribed to trip ${tripId}`, 'ALREADY_INSCRIBED');
		this.name = 'AlreadyInscribedError';
	}
}

/**
 * Thrown when a trip has no more available seats for new inscriptions.
 * @param tripId - The UUID of the full trip.
 */
export class NoSeatsAvailableError extends DomainError {
	constructor(tripId: string) {
		super(`No seats available on trip ${tripId}`, 'NO_SEATS_AVAILABLE');
		this.name = 'NoSeatsAvailableError';
	}
}

/**
 * Thrown when a color cannot be found by the given identifier.
 * @param id - The UUID of the color.
 */
export class ColorNotFoundError extends DomainError {
	constructor(id: string) {
		super(`Color not found: ${id}`, 'COLOR_NOT_FOUND');
		this.name = 'ColorNotFoundError';
	}
}

/**
 * Thrown when attempting to create a color with a name that already exists.
 * @param name - The duplicate color name.
 */
export class ColorAlreadyExistsError extends DomainError {
	constructor(name: string) {
		super(`Color already exists: ${name}`, 'COLOR_ALREADY_EXISTS');
		this.name = 'ColorAlreadyExistsError';
	}
}

/**
 * Thrown when a user attempts to access or modify a resource they do not own.
 * @param resource - The type of resource (e.g. "Car", "Trip").
 * @param id - The UUID of the resource.
 */
export class ForbiddenError extends DomainError {
	constructor(resource: string, id: string) {
		super(`You do not have permission to access ${resource}: ${id}`, 'FORBIDDEN');
		this.name = 'ForbiddenError';
	}
}
