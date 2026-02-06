import { inject, injectable } from 'tsyringe';
import { InscriptionNotFoundError } from '../../../domain/errors/domain.errors.js';
import type { InscriptionRepository } from '../../../domain/repositories/inscription.repository.js';
import type { RepositoryError } from '../../../infrastructure/errors/repository.errors.js';
import { TOKENS } from '../../../lib/shared/di/tokens.js';
import type { Result } from '../../../lib/shared/types/result.js';
import { err } from '../../../lib/shared/types/result.js';

type DeleteInscriptionError = InscriptionNotFoundError | RepositoryError;

@injectable()
export class DeleteInscriptionUseCase {
	constructor(
		@inject(TOKENS.InscriptionRepository)
		private readonly inscriptionRepository: InscriptionRepository,
	) {}

	async execute(id: string): Promise<Result<void, DeleteInscriptionError>> {
		const findResult = await this.inscriptionRepository.findById(id);
		if (!findResult.success) {
			return findResult;
		}

		if (!findResult.value) {
			return err(new InscriptionNotFoundError(id));
		}

		return this.inscriptionRepository.delete(id);
	}
}
