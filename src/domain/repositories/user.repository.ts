import type { Result } from '../../lib/shared/types/result.js';
import type { RepositoryError } from '../../lib/errors/repository.errors.js';
import type { CreateUserData, PublicUserEntity, UpdateUserData } from '../entities/user.entity.js';

export interface UserRepository {
	findAll(): Promise<Result<PublicUserEntity[], RepositoryError>>;
	findById(id: string): Promise<Result<PublicUserEntity | null, RepositoryError>>;
	findByAuthRefId(authRefId: number): Promise<Result<PublicUserEntity | null, RepositoryError>>;
	create(data: CreateUserData): Promise<Result<PublicUserEntity, RepositoryError>>;
	update(id: string, data: UpdateUserData): Promise<Result<PublicUserEntity, RepositoryError>>;
	delete(id: string): Promise<Result<void, RepositoryError>>;
	anonymize(id: string): Promise<Result<void, RepositoryError>>;
}
