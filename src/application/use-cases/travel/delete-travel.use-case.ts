import { inject, injectable } from 'tsyringe';
import { TravelNotFoundError } from '../../../domain/errors/domain.errors.js';
import type { TravelRepository } from '../../../domain/repositories/travel.repository.js';
import type { RepositoryError } from '../../../infrastructure/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';

type DeleteTravelError = TravelNotFoundError | RepositoryError;

@injectable()
export class DeleteTravelUseCase {
	constructor(
		@inject(TOKENS.TravelRepository)
		private readonly travelRepository: TravelRepository,
	) {}

	async execute(id: string): Promise<Result<void, DeleteTravelError>> {
		const findResult = await this.travelRepository.findById(id);
		if (!findResult.success) {
			return findResult;
		}

		if (!findResult.value) {
			return err(new TravelNotFoundError(id));
		}

		return this.travelRepository.delete(id);
	}
}
