export class DomainError extends Error {
	constructor(
		message: string,
		public readonly code: string,
	) {
		super(message);
		this.name = 'DomainError';
	}
}

export class UserAlreadyExistsError extends DomainError {
	constructor(email: string) {
		super(`A user with email "${email}" already exists`, 'USER_ALREADY_EXISTS');
		this.name = 'UserAlreadyExistsError';
	}
}

export class InvalidCredentialsError extends DomainError {
	constructor() {
		super('Invalid email or password', 'INVALID_CREDENTIALS');
		this.name = 'InvalidCredentialsError';
	}
}

export class UserNotFoundError extends DomainError {
	constructor(identifier: string) {
		super(`User not found: ${identifier}`, 'USER_NOT_FOUND');
		this.name = 'UserNotFoundError';
	}
}

export class BrandNotFoundError extends DomainError {
	constructor(identifier: string) {
		super(`Brand not found: ${identifier}`, 'BRAND_NOT_FOUND');
		this.name = 'BrandNotFoundError';
	}
}

export class CityNotFoundError extends DomainError {
	constructor(identifier: string) {
		super(`City not found: ${identifier}`, 'CITY_NOT_FOUND');
		this.name = 'CityNotFoundError';
	}
}

export class CarNotFoundError extends DomainError {
	constructor(identifier: string) {
		super(`Car not found: ${identifier}`, 'CAR_NOT_FOUND');
		this.name = 'CarNotFoundError';
	}
}

export class CarAlreadyExistsError extends DomainError {
	constructor(immat: string) {
		super(`A car with immatriculation "${immat}" already exists`, 'CAR_ALREADY_EXISTS');
		this.name = 'CarAlreadyExistsError';
	}
}

export class DriverNotFoundError extends DomainError {
	constructor(identifier: string) {
		super(`Driver not found: ${identifier}`, 'DRIVER_NOT_FOUND');
		this.name = 'DriverNotFoundError';
	}
}

export class RouteNotFoundError extends DomainError {
	constructor(identifier: string) {
		super(`Route not found: ${identifier}`, 'ROUTE_NOT_FOUND');
		this.name = 'RouteNotFoundError';
	}
}

export class InscriptionNotFoundError extends DomainError {
	constructor(identifier: string) {
		super(`Inscription not found: ${identifier}`, 'INSCRIPTION_NOT_FOUND');
		this.name = 'InscriptionNotFoundError';
	}
}

export class AlreadyInscribedError extends DomainError {
	constructor(userId: string, routeId: string) {
		super(`User ${userId} is already inscribed to route ${routeId}`, 'ALREADY_INSCRIBED');
		this.name = 'AlreadyInscribedError';
	}
}

export class NoSeatsAvailableError extends DomainError {
	constructor(routeId: string) {
		super(`No seats available on route ${routeId}`, 'NO_SEATS_AVAILABLE');
		this.name = 'NoSeatsAvailableError';
	}
}
