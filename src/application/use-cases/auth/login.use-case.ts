import { inject, injectable } from "tsyringe";
import { InvalidCredentialsError } from "@/domain/errors/domain.errors.js";
import type { UserRepository } from "@/domain/repositories/user.repository.js";
import type { JwtService } from "@/domain/services/jwt.service.js";
import type { PasswordService } from "@/domain/services/password.service.js";
import { TOKENS } from "@/shared/di/tokens.js";
import type { AuthResponse, LoginInput } from "@/application/dtos/auth.dto.js";

@injectable()
export class LoginUseCase {
  constructor(
    @inject(TOKENS.UserRepository)
    private readonly userRepository: UserRepository,
    @inject(TOKENS.PasswordService)
    private readonly passwordService: PasswordService,
    @inject(TOKENS.JwtService)
    private readonly jwtService: JwtService
  ) {}

  async execute(input: LoginInput): Promise<AuthResponse> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const isValidPassword = await this.passwordService.verify(
      input.password,
      user.password
    );
    if (!isValidPassword) {
      throw new InvalidCredentialsError();
    }

    const token = await this.jwtService.sign({ userId: user.id });

    return {
      userId: user.id,
      token,
    };
  }
}
