import type { Result } from '../../lib/shared/types/result.js';
import type { RepositoryError } from '../../infrastructure/errors/repository.errors.js';
import type { CreateInscriptionData, InscriptionEntity } from '../entities/inscription.entity.js';

export interface InscriptionRepository {
	findAll(params?: { skip: number; take: number }): Promise<Result<{ data: InscriptionEntity[]; total: number }, RepositoryError>>;
	findById(id: string): Promise<Result<InscriptionEntity | null, RepositoryError>>;
	findByUserId(userId: string): Promise<Result<InscriptionEntity[], RepositoryError>>;
	findByRouteId(routeId: string): Promise<Result<InscriptionEntity[], RepositoryError>>;
	create(data: CreateInscriptionData): Promise<Result<InscriptionEntity, RepositoryError>>;
	delete(id: string): Promise<Result<void, RepositoryError>>;
	existsByUserAndRoute(userId: string, routeId: string): Promise<Result<boolean, RepositoryError>>;
	countByRouteId(routeId: string): Promise<Result<number, RepositoryError>>;
}
