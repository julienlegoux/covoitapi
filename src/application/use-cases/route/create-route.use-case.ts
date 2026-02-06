import { inject, injectable } from 'tsyringe';
import type { RouteEntity } from '../../../domain/entities/route.entity.js';
import { DriverNotFoundError } from '../../../domain/errors/domain.errors.js';
import type { DriverRepository } from '../../../domain/repositories/driver.repository.js';
import type { CityRepository } from '../../../domain/repositories/city.repository.js';
import type { RouteRepository } from '../../../domain/repositories/route.repository.js';
import type { RepositoryError } from '../../../infrastructure/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';
import type { CreateRouteInput } from '../../dtos/route.dto.js';

type CreateRouteError = DriverNotFoundError | RepositoryError;

@injectable()
export class CreateRouteUseCase {
	constructor(
		@inject(TOKENS.RouteRepository)
		private readonly routeRepository: RouteRepository,
		@inject(TOKENS.DriverRepository)
		private readonly driverRepository: DriverRepository,
		@inject(TOKENS.CityRepository)
		private readonly cityRepository: CityRepository,
	) {}

	async execute(input: CreateRouteInput): Promise<Result<RouteEntity, CreateRouteError>> {
		// Find driver for this user
		const driverResult = await this.driverRepository.findByUserId(input.idpers);
		if (!driverResult.success) {
			return driverResult;
		}

		if (!driverResult.value) {
			return err(new DriverNotFoundError(input.idpers));
		}

		// Find or create departure city
		const departureCityResult = await this.cityRepository.findByCityName(input.villeD);
		if (!departureCityResult.success) {
			return departureCityResult;
		}

		let departureCityId: string;
		if (departureCityResult.value) {
			departureCityId = departureCityResult.value.id;
		} else {
			const createDepartureResult = await this.cityRepository.create({
				cityName: input.villeD,
				zipcode: '',
			});
			if (!createDepartureResult.success) {
				return createDepartureResult;
			}
			departureCityId = createDepartureResult.value.id;
		}

		// Find or create arrival city
		const arrivalCityResult = await this.cityRepository.findByCityName(input.villeA);
		if (!arrivalCityResult.success) {
			return arrivalCityResult;
		}

		let arrivalCityId: string;
		if (arrivalCityResult.value) {
			arrivalCityId = arrivalCityResult.value.id;
		} else {
			const createArrivalResult = await this.cityRepository.create({
				cityName: input.villeA,
				zipcode: '',
			});
			if (!createArrivalResult.success) {
				return createArrivalResult;
			}
			arrivalCityId = createArrivalResult.value.id;
		}

		// Create the route with city links via nested writes
		return this.routeRepository.create({
			dateRoute: new Date(input.dateT),
			kms: input.kms,
			seats: input.seats,
			driverId: driverResult.value.id,
			carId: input.carId,
			cityIds: [departureCityId, arrivalCityId],
		});
	}
}
