import { inject, injectable } from 'tsyringe';
import type { RouteEntity } from '../../../domain/entities/route.entity.js';
import type { RouteRepository } from '../../../domain/repositories/route.repository.js';
import type { RepositoryError } from '../../../infrastructure/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import type { FindRouteInput } from '../../dtos/route.dto.js';

@injectable()
export class FindRouteUseCase {
	constructor(
		@inject(TOKENS.RouteRepository)
		private readonly routeRepository: RouteRepository,
	) {}

	async execute(input: FindRouteInput): Promise<Result<RouteEntity[], RepositoryError>> {
		return this.routeRepository.findByFilters({
			departureCity: input.villeD,
			arrivalCity: input.villeA,
			date: input.dateT ? new Date(input.dateT) : undefined,
		});
	}
}
