import { inject, injectable } from 'tsyringe';
import type { RouteEntity } from '../../../domain/entities/route.entity.js';
import type { RouteRepository } from '../../../domain/repositories/route.repository.js';
import type { RepositoryError } from '../../../infrastructure/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';

@injectable()
export class ListRoutesUseCase {
	constructor(
		@inject(TOKENS.RouteRepository)
		private readonly routeRepository: RouteRepository,
	) {}

	async execute(): Promise<Result<RouteEntity[], RepositoryError>> {
		return this.routeRepository.findAll();
	}
}
