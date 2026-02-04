import type { Result } from '../../lib/shared/types/result.js';
import type { RepositoryError } from '../../infrastructure/errors/repository.errors.js';
import type { CreateUserData, UserEntity } from '../entities/user.entity.js';

export interface UserRepository {
	findById(id: string): Promise<Result<UserEntity | null, RepositoryError>>;
	findByEmail(email: string): Promise<Result<UserEntity | null, RepositoryError>>;
	create(data: CreateUserData): Promise<Result<UserEntity, RepositoryError>>;
	existsByEmail(email: string): Promise<Result<boolean, RepositoryError>>;
}
