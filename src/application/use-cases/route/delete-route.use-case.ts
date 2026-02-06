import { inject, injectable } from 'tsyringe';
import { RouteNotFoundError } from '../../../domain/errors/domain.errors.js';
import type { RouteRepository } from '../../../domain/repositories/route.repository.js';
import type { RepositoryError } from '../../../infrastructure/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';

type DeleteRouteError = RouteNotFoundError | RepositoryError;

@injectable()
export class DeleteRouteUseCase {
	constructor(
		@inject(TOKENS.RouteRepository)
		private readonly routeRepository: RouteRepository,
	) {}

	async execute(id: string): Promise<Result<void, DeleteRouteError>> {
		const findResult = await this.routeRepository.findById(id);
		if (!findResult.success) {
			return findResult;
		}

		if (!findResult.value) {
			return err(new RouteNotFoundError(id));
		}

		return this.routeRepository.delete(id);
	}
}
