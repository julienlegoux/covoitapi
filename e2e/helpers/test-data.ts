/**
 * Factory functions for generating unique test payloads.
 */

let seq = 0;
function next(): number {
	return ++seq;
}

export function brandPayload(name?: string) {
	return { name: name ?? `Brand-${next()}-${Date.now()}` };
}

export function colorPayload(name?: string, hex?: string) {
	return { name: name ?? `Color-${next()}`, hex: hex ?? '#FF0000' };
}

export function cityPayload(cityName?: string, zipcode?: string) {
	return {
		cityName: cityName ?? `City-${next()}`,
		zipcode: zipcode ?? '75000',
	};
}

export function carPayload(brandId: string, model?: string, licensePlate?: string) {
	return {
		model: model ?? `Model-${next()}`,
		brandId,
		licensePlate: licensePlate ?? `LP-${next()}-${Date.now()}`,
	};
}

export function tripPayload(
	carId: string,
	opts?: Partial<{
		kms: number;
		date: string;
		departureCity: string;
		arrivalCity: string;
		seats: number;
	}>,
) {
	return {
		kms: opts?.kms ?? 100,
		date:
			opts?.date ??
			new Date(Date.now() + 86_400_000).toISOString().split('T')[0],
		departureCity: opts?.departureCity ?? `Departure-${next()}`,
		arrivalCity: opts?.arrivalCity ?? `Arrival-${next()}`,
		seats: opts?.seats ?? 3,
		carId,
	};
}

export function profilePayload(
	firstName?: string,
	lastName?: string,
	phone?: string,
) {
	return {
		firstName: firstName ?? 'Test',
		lastName: lastName ?? 'User',
		phone: phone ?? '0612345678',
	};
}

export function vpPersonPayload(overrides?: Partial<{
	firstname: string;
	lastname: string;
	phone: string;
	email: string;
	password: string;
}>) {
	const n = next();
	return {
		firstname: overrides?.firstname ?? `First-${n}`,
		lastname: overrides?.lastname ?? `Last-${n}`,
		phone: overrides?.phone ?? '0612345678',
		email: overrides?.email ?? `vp-person-${n}-${Date.now()}@e2e.test`,
		password: overrides?.password ?? 'TestPassword1',
	};
}

export function vpCarPayload(brandName: string, overrides?: Partial<{
	carregistration: string;
	model: string;
}>) {
	const n = next();
	return {
		carregistration: overrides?.carregistration ?? `VP-${n}-${Date.now()}`,
		model: overrides?.model ?? `VpModel-${n}`,
		brand: brandName,
	};
}

export function vpTripPayload(
	carId: string,
	personId: string,
	overrides?: Partial<{
		kms: number;
		trip_datetime: string;
		seats: number;
		startingCity: string;
		arrivalCity: string;
	}>,
) {
	return {
		kms: overrides?.kms ?? 150,
		trip_datetime:
			overrides?.trip_datetime ??
			new Date(Date.now() + 86_400_000).toISOString(),
		seats: overrides?.seats ?? 4,
		car_id: carId,
		person_id: personId,
		starting_address: {
			city_name: overrides?.startingCity ?? `VpStart-${next()}`,
		},
		arrival_address: {
			city_name: overrides?.arrivalCity ?? `VpArrival-${next()}`,
		},
	};
}
