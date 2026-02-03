import type { Context } from "hono";
import { container } from "../../infrastructure/di/container.js";
import { RegisterUseCase } from "../../application/use_cases/auth/register.use_case.js";
import { LoginUseCase } from "../../application/use_cases/auth/login.use_case.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";
import type { RegisterInput, LoginInput } from "../../application/dtos/auth.dto.js";

export async function register(c: Context): Promise<Response> {
  const body = await c.req.json();
  const validated = registerSchema.parse(body);

  const input: RegisterInput = {
    email: validated.email,
    password: validated.password,
    confirmPassword: validated.confirmPassword,
    firstName: validated.firstName,
    lastName: validated.lastName,
    phone: validated.phone,
  };

  const registerUseCase = container.resolve(RegisterUseCase);
  const result = await registerUseCase.execute(input);

  return c.json(
    {
      success: true,
      data: result,
    },
    201
  );
}

export async function login(c: Context): Promise<Response> {
  const body = await c.req.json();
  const validated = loginSchema.parse(body);

  const input: LoginInput = {
    email: validated.email,
    password: validated.password,
  };

  const loginUseCase = container.resolve(LoginUseCase);
  const result = await loginUseCase.execute(input);

  return c.json({
    success: true,
    data: result,
  });
}
