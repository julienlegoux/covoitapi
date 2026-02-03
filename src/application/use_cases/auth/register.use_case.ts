import { inject, injectable } from "tsyringe";
import { TOKENS } from "../../../infrastructure/di/tokens.js";
import type { UserRepository } from "../../../domain/repositories/user.repository.js";
import type { PasswordService } from "../../../domain/services/password.service.js";
import type { EmailService } from "../../../domain/services/email.service.js";
import type { JwtService } from "../../../domain/services/jwt.service.js";
import { UserAlreadyExistsError } from "../../../domain/errors/domain.errors.js";
import type { RegisterInput, AuthResponse } from "../../dtos/auth.dto.js";

@injectable()
export class RegisterUseCase {
  constructor(
    @inject(TOKENS.UserRepository)
    private readonly userRepository: UserRepository,
    @inject(TOKENS.PasswordService)
    private readonly passwordService: PasswordService,
    @inject(TOKENS.EmailService)
    private readonly emailService: EmailService,
    @inject(TOKENS.JwtService)
    private readonly jwtService: JwtService
  ) {}

  async execute(input: RegisterInput): Promise<AuthResponse> {
    const existingUser = await this.userRepository.existsByEmail(input.email);
    if (existingUser) {
      throw new UserAlreadyExistsError(input.email);
    }

    const hashedPassword = await this.passwordService.hash(input.password);

    const user = await this.userRepository.create({
      email: input.email,
      password: hashedPassword,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
    });

    await this.emailService.sendWelcomeEmail(user.email, user.firstName);

    const token = await this.jwtService.sign({ userId: user.id });

    return {
      userId: user.id,
      token,
    };
  }
}
