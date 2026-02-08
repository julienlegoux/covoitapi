import { inject, injectable } from 'tsyringe';
import type { InscriptionEntity } from '../../../domain/entities/inscription.entity.js';
import { TravelNotFoundError } from '../../../lib/errors/domain.errors.js';
import type { InscriptionRepository } from '../../../domain/repositories/inscription.repository.js';
import type { TravelRepository } from '../../../domain/repositories/travel.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { type PaginationParams, type PaginatedResult, buildPaginationMeta } from '../../../lib/shared/utils/pagination.util.js';

type ListRoutePassengersError = TravelNotFoundError | RepositoryError;

@injectable()
export class ListRoutePassengersUseCase {
	constructor(
		@inject(TOKENS.InscriptionRepository)
		private readonly inscriptionRepository: InscriptionRepository,
		@inject(TOKENS.TravelRepository)
		private readonly travelRepository: TravelRepository,
	) {}

	async execute(routeId: string, pagination?: PaginationParams): Promise<Result<PaginatedResult<InscriptionEntity>, ListRoutePassengersError>> {
		// Resolve routeId UUID to refId
		const travelResult = await this.travelRepository.findById(routeId);
		if (!travelResult.success) return travelResult;
		if (!travelResult.value) return err(new TravelNotFoundError(routeId));

		const result = await this.inscriptionRepository.findByRouteRefId(travelResult.value.refId);
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
