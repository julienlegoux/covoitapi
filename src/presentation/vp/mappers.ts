import type { PublicUserEntity } from '../../domain/entities/user.entity.js';
import type { CarEntity } from '../../domain/entities/car.entity.js';
import type { VpPersonResponse, VpCarResponse } from './types.js';

export function toVpPerson(user: PublicUserEntity): VpPersonResponse {
	return {
		id: user.id,
		firstname: user.firstName,
		lastname: user.lastName,
		phone: user.phone,
		email: user.email,
		created_at: user.createdAt.toISOString(),
		updated_at: user.updatedAt.toISOString(),
	};
}

export function toVpCar(car: CarEntity): VpCarResponse {
	return {
		id: car.id,
		carregistration: car.licensePlate,
		model_ref_id: car.modelRefId,
		driver_ref_id: car.driverRefId,
	};
}
