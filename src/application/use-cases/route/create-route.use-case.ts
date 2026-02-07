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
		const driverResult = await this.driverRepository.findByUserId(input.idpers);
		if (!driverResult.success) {
			return driverResult;
		}

		if (!driverResult.value) {
			return err(new DriverNotFoundError(input.idpers));
		}

		const departureCityIdResult = await this.findOrCreateCity(input.villeD);
		if (!departureCityIdResult.success) {
			return departureCityIdResult;
		}

		const arrivalCityIdResult = await this.findOrCreateCity(input.villeA);
		if (!arrivalCityIdResult.success) {
			return arrivalCityIdResult;
		}

		return this.routeRepository.create({
			dateRoute: new Date(input.dateT),
			kms: input.kms,
			seats: input.seats,
			driverId: driverResult.value.id,
			carId: input.carId,
			cityIds: [departureCityIdResult.value, arrivalCityIdResult.value],
		});
	}

	private async findOrCreateCity(cityName: string): Promise<Result<string, RepositoryError>> {
		const findResult = await this.cityRepository.findByCityName(cityName);
		if (!findResult.success) {
			return findResult;
		}

		if (findResult.value) {
			return { success: true, value: findResult.value.id };
		}

		const createResult = await this.cityRepository.create({ cityName, zipcode: '' });
		if (!createResult.success) {
			return createResult;
		}

		return { success: true, value: createResult.value.id };
	}
}
