import { inject, injectable } from 'tsyringe';
import type { InscriptionEntity } from '../../../domain/entities/inscription.entity.js';
import { UserNotFoundError } from '../../../lib/errors/domain.errors.js';
import type { InscriptionRepository } from '../../../domain/repositories/inscription.repository.js';
import type { UserRepository } from '../../../domain/repositories/user.repository.js';
import type { RepositoryError } from '../../../lib/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { ok, err } from '../../../lib/shared/types/result.js';
import { type PaginationParams, type PaginatedResult, buildPaginationMeta } from '../../../lib/shared/utils/pagination.util.js';

type ListUserInscriptionsError = UserNotFoundError | RepositoryError;

@injectable()
export class ListUserInscriptionsUseCase {
	constructor(
		@inject(TOKENS.InscriptionRepository)
		private readonly inscriptionRepository: InscriptionRepository,
		@inject(TOKENS.UserRepository)
		private readonly userRepository: UserRepository,
	) {}

	async execute(userId: string, pagination?: PaginationParams): Promise<Result<PaginatedResult<InscriptionEntity>, ListUserInscriptionsError>> {
		// Resolve userId UUID to refId
		const userResult = await this.userRepository.findById(userId);
		if (!userResult.success) return userResult;
		if (!userResult.value) return err(new UserNotFoundError(userId));

		const result = await this.inscriptionRepository.findByUserRefId(userResult.value.refId);
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
