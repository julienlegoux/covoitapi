import { inject, injectable } from 'tsyringe';
import type { TravelEntity } from '../../../domain/entities/travel.entity.js';
import { TravelNotFoundError } from '../../../lib/errors/domain.errors.js';
import type { TravelRepository } from '../../../domain/repositories/travel.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok, err } from '../../../lib/shared/types/result.js';

type GetTravelError = TravelNotFoundError | RepositoryError;

@injectable()
export class GetTravelUseCase {
	constructor(
		@inject(TOKENS.TravelRepository)
		private readonly travelRepository: TravelRepository,
	) {}

	async execute(id: string): Promise<Result<TravelEntity, GetTravelError>> {
		const result = await this.travelRepository.findById(id);
		if (!result.success) {
			return result;
		}

		if (!result.value) {
			return err(new TravelNotFoundError(id));
		}

		return ok(result.value);
	}
}
