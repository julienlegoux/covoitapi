import type { Result } from '../../lib/shared/types/result.js';
import type { RepositoryError } from '../../lib/errors/repository.errors.js';
import type { AuthEntity, CreateAuthData } from '../entities/auth.entity.js';
import type { CreateUserData } from '../entities/user.entity.js';
import type { PublicUserEntity } from '../entities/user.entity.js';

export interface AuthRepository {
	findByEmail(email: string): Promise<Result<AuthEntity | null, RepositoryError>>;
	createWithUser(
		authData: CreateAuthData,
		userData: Omit<CreateUserData, 'authRefId'>,
	): Promise<Result<{ auth: AuthEntity; user: PublicUserEntity }, RepositoryError>>;
	existsByEmail(email: string): Promise<Result<boolean, RepositoryError>>;
	updateRole(refId: number, role: string): Promise<Result<void, RepositoryError>>;
}
