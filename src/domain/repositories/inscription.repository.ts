import type { Result } from '../../lib/shared/types/result.js';
import type { RepositoryError } from '../../lib/errors/repository.errors.js';
import type { CreateInscriptionData, InscriptionEntity } from '../entities/inscription.entity.js';

export interface InscriptionRepository {
	findAll(params?: { skip: number; take: number }): Promise<Result<{ data: InscriptionEntity[]; total: number }, RepositoryError>>;
	findById(id: string): Promise<Result<InscriptionEntity | null, RepositoryError>>;
	findByUserRefId(userRefId: number): Promise<Result<InscriptionEntity[], RepositoryError>>;
	findByRouteRefId(routeRefId: number): Promise<Result<InscriptionEntity[], RepositoryError>>;
	create(data: CreateInscriptionData): Promise<Result<InscriptionEntity, RepositoryError>>;
	delete(id: string): Promise<Result<void, RepositoryError>>;
	existsByUserAndRoute(userRefId: number, routeRefId: number): Promise<Result<boolean, RepositoryError>>;
	countByRouteRefId(routeRefId: number): Promise<Result<number, RepositoryError>>;
}
