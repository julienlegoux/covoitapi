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
		// We attempt deletion directly; Prisma will throw if not found
		return this.inscriptionRepository.delete(id);
	}
}
