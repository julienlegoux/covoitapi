import { inject, injectable } from 'tsyringe';
import type { TravelEntity } from '../../../domain/entities/travel.entity.js';
import type { TravelRepository } from '../../../domain/repositories/travel.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import type { FindTravelInput } from '../../dtos/travel.dto.js';

@injectable()
export class FindTravelUseCase {
	constructor(
		@inject(TOKENS.TravelRepository)
		private readonly travelRepository: TravelRepository,
	) {}

	async execute(input: FindTravelInput): Promise<Result<TravelEntity[], RepositoryError>> {
		return this.travelRepository.findByFilters({
			departureCity: input.departureCity,
			arrivalCity: input.arrivalCity,
			date: input.date ? new Date(input.date) : undefined,
		});
	}
}
