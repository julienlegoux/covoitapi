import { inject, injectable } from 'tsyringe';
import type { InscriptionEntity } from '../../../domain/entities/inscription.entity.js';
import type { InscriptionRepository } from '../../../domain/repositories/inscription.repository.js';
import type { RepositoryError } from '../../../infrastructure/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok } from '../../../lib/shared/types/result.js';
import { type PaginationParams, type PaginatedResult, buildPaginationMeta } from '../../../lib/shared/utils/pagination.util.js';

@injectable()
export class ListRoutePassengersUseCase {
	constructor(
		@inject(TOKENS.InscriptionRepository)
		private readonly inscriptionRepository: InscriptionRepository,
	) {}

	async execute(routeId: string, pagination?: PaginationParams): Promise<Result<PaginatedResult<InscriptionEntity>, RepositoryError>> {
		const result = await this.inscriptionRepository.findByRouteId(routeId);
		if (!result.success) return result;
		const all = result.value;
		const params = pagination ?? { page: 1, limit: 20 };
		const start = (params.page - 1) * params.limit;
		const data = all.slice(start, start + params.limit);
		return ok({
			data,
			meta: buildPaginationMeta(params, all.length),
		});
	}
}
