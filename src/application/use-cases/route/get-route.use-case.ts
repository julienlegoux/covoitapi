import { inject, injectable } from 'tsyringe';
import type { RouteEntity } from '../../../domain/entities/route.entity.js';
import { RouteNotFoundError } from '../../../domain/errors/domain.errors.js';
import type { RouteRepository } from '../../../domain/repositories/route.repository.js';
import type { RepositoryError } from '../../../infrastructure/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok, err } from '../../../lib/shared/types/result.js';

type GetRouteError = RouteNotFoundError | RepositoryError;

@injectable()
export class GetRouteUseCase {
	constructor(
		@inject(TOKENS.RouteRepository)
		private readonly routeRepository: RouteRepository,
	) {}

	async execute(id: string): Promise<Result<RouteEntity, GetRouteError>> {
		const result = await this.routeRepository.findById(id);
		if (!result.success) {
			return result;
		}

		if (!result.value) {
			return err(new RouteNotFoundError(id));
		}

		return ok(result.value);
	}
}
