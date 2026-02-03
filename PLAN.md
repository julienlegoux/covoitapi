# Carpooling API - Project Plan

## Overview

REST API for a carpooling application built for GRETA students. This document covers Phase 1: Authentication and Email modules.

---

## Tech Stack

| Concern | Choice |
|---------|--------|
| Framework | Hono + @hono/node-server |
| Database | Prisma + Accelerate PostgreSQL (serverless) |
| ORM | Prisma |
| Auth | hono/jwt |
| Password Hashing | Argon2 |
| Validation | Zod |
| Email | Resend |
| DI Container | tsyringe |
| Testing | Vitest |

---

## Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Class / Type / Interface | PascalCase | `UserEntity`, `AuthService` |
| Variable / Function | camelCase | `findById`, `hashedPassword` |
| Files / Folders | snake_case | `user.entity.ts`, `use_cases/` |

---

## Architecture

Clean Architecture with 4 layers:

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION                         │
│            (routes, controllers, middleware)            │
├─────────────────────────────────────────────────────────┤
│                    APPLICATION                          │
│                (use cases, DTOs)                        │
├─────────────────────────────────────────────────────────┤
│                      DOMAIN                             │
│          (entities, repository interfaces,              │
│              service interfaces, errors)                │
├─────────────────────────────────────────────────────────┤
│                   INFRASTRUCTURE                        │
│    (database, external APIs, implementations)           │
└─────────────────────────────────────────────────────────┘
```

**Dependency Rule:** Outer layers depend on inner layers. Domain has zero external dependencies.

---

## Folder Structure

```
project_root/
├── src/
│   ├── domain/                             # Core business rules, no external dependencies
│   │   ├── entities/
│   │   │   └── user.entity.ts              # User type definition (id, login, email, etc.)
│   │   ├── repositories/
│   │   │   └── user.repository.ts          # Interface: what operations can be done on users (find, create, etc.)
│   │   ├── services/
│   │   │   ├── email.service.ts            # Interface: send email (no implementation details)
│   │   │   └── password.service.ts         # Interface: hash and verify passwords
│   │   └── errors/
│   │       └── domain.errors.ts            # Business rule violations (UserAlreadyExists, InvalidCredentials)
│   │
│   ├── application/                        # Use cases, orchestrates domain logic
│   │   ├── use_cases/
│   │   │   └── auth/
│   │   │       ├── register.use_case.ts    # Orchestrates: validate → check duplicate → hash password → save → send email
│   │   │       ├── register.use_case.test.ts
│   │   │       ├── login.use_case.ts       # Orchestrates: find user → verify password → generate JWT
│   │   │       └── login.use_case.test.ts
│   │   ├── dtos/
│   │   │   └── auth.dto.ts                 # Input/Output shapes (RegisterInput, LoginInput, AuthResponse)
│   │   └── errors/
│   │       └── application.errors.ts       # Use case failures (ValidationError, NotFoundError)
│   │
│   ├── infrastructure/                     # External world: database, APIs, libraries
│   │   ├── database/
│   │   │   ├── prisma/
│   │   │   │   └── schema.prisma           # Database schema definition for Prisma
│   │   │   └── repositories/
│   │   │       ├── prisma_user.repository.ts      # Implements UserRepository using Prisma
│   │   │       └── prisma_user.repository.test.ts # Tests actual database operations
│   │   ├── services/
│   │   │   ├── resend_email.service.ts     # Implements EmailService using Resend API
│   │   │   ├── resend_email.service.test.ts
│   │   │   ├── argon_password.service.ts   # Implements PasswordService using Argon2
│   │   │   └── argon_password.service.test.ts
│   │   ├── config/
│   │   │   └── env.config.ts               # Loads and validates environment variables
│   │   └── di/
│   │       ├── tokens.ts                   # Injection tokens as symbols (USER_REPOSITORY, etc.)
│   │       └── container.ts                # tsyringe container: registers all implementations
│   │
│   ├── presentation/                       # HTTP layer: routes, controllers, validation
│   │   ├── routes/
│   │   │   ├── auth.routes.ts              # Defines POST /auth/register and POST /auth/login
│   │   │   ├── auth.routes.test.ts         # Integration tests: full HTTP request → response
│   │   │   └── index.ts                    # Aggregates all routes into single Hono app
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts          # Extracts and verifies JWT from x-auth-token header
│   │   │   ├── auth.middleware.test.ts
│   │   │   └── error_handler.middleware.ts # Catches errors → standardized JSON error response
│   │   ├── validators/
│   │   │   └── auth.validator.ts           # Zod schemas for register/login request bodies
│   │   └── controllers/
│   │       └── auth.controller.ts          # HTTP request → calls use case → HTTP response
│   │
│   ├── shared/                             # Cross-cutting utilities
│   │   ├── types/
│   │   │   └── index.ts                    # Shared TypeScript types (Result, ApiResponse, etc.)
│   │   └── utils/
│   │       ├── response.util.ts            # Helpers for consistent JSON responses
│   │       └── logger.util.ts              # Logging wrapper
│   │
│   └── index.ts                            # Entry point: imports reflect-metadata, starts server
│
├── tests/
│   └── setup.ts                            # Global test config: database reset, mocks, test container
│
├── .env.example                            # Template for required environment variables
├── package.json                            # Dependencies and scripts
├── tsconfig.json                           # TypeScript config (experimentalDecorators: true)
├── vitest.config.ts                        # Test runner configuration
└── README.md                               # Project documentation
```

---

## Dependency Injection with tsyringe

### Why tsyringe?

- Automatic dependency resolution via decorators
- Easy to swap implementations (production vs test mocks)
- Follows Dependency Inversion Principle (SOLID)
- Lightweight, works with TypeScript decorators

### Injection Tokens

```typescript
// src/infrastructure/di/tokens.ts
export const TOKENS = {
  UserRepository: Symbol('UserRepository'),
  EmailService: Symbol('EmailService'),
  PasswordService: Symbol('PasswordService'),
  PrismaClient: Symbol('PrismaClient')
}
```

### Container Registration

```typescript
// src/infrastructure/di/container.ts
import 'reflect-metadata'
import { container } from 'tsyringe'
import { TOKENS } from './tokens'
import { PrismaUserRepository } from '../database/repositories/prisma_user.repository'
import { ResendEmailService } from '../services/resend_email.service'
import { ArgonPasswordService } from '../services/argon_password.service'
import { PrismaClient } from '@prisma/client'

// Register PrismaClient as singleton
container.registerSingleton(TOKENS.PrismaClient, PrismaClient)

// Register implementations
container.register(TOKENS.UserRepository, { useClass: PrismaUserRepository })
container.register(TOKENS.EmailService, { useClass: ResendEmailService })
container.register(TOKENS.PasswordService, { useClass: ArgonPasswordService })

export { container }
```

### Use Case with Injection

```typescript
// src/application/use_cases/auth/register.use_case.ts
import { injectable, inject } from 'tsyringe'
import { TOKENS } from '../../../infrastructure/di/tokens'
import { UserRepository } from '../../../domain/repositories/user.repository'
import { PasswordService } from '../../../domain/services/password.service'
import { EmailService } from '../../../domain/services/email.service'
import { RegisterInput, AuthResponse } from '../../dtos/auth.dto'

@injectable()
export class RegisterUseCase {
  constructor(
    @inject(TOKENS.UserRepository) private userRepository: UserRepository,
    @inject(TOKENS.PasswordService) private passwordService: PasswordService,
    @inject(TOKENS.EmailService) private emailService: EmailService
  ) {}

  async execute(input: RegisterInput): Promise<AuthResponse> {
    // 1. Check if user already exists
    // 2. Hash password
    // 3. Create user
    // 4. Send welcome email
    // 5. Generate JWT
    // 6. Return response
  }
}
```

### Resolving Dependencies

```typescript
// In controller or route
import { container } from '../../infrastructure/di/container'
import { RegisterUseCase } from '../../application/use_cases/auth/register.use_case'

const registerUseCase = container.resolve(RegisterUseCase)
```

---

## Database Schema (Phase 1)

### User Table

| Field | Type | Constraints |
|-------|------|-------------|
| id | UUID | PK, auto-generated |
| login | String | Unique, not null |
| password | String | Hashed, not null |
| email | String | Not null |
| first_name | String | Not null |
| last_name | String | Not null |
| phone | String | Not null |
| created_at | DateTime | Default now() |
| updated_at | DateTime | Auto-updated |

### Prisma Schema

```prisma
// src/infrastructure/database/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id         String   @id @default(uuid())
  login      String   @unique
  password   String
  firstName  String   @map("first_name")
  lastName   String   @map("last_name")
  phone      String
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  @@map("users")
}
```

---

## API Routes (Phase 1)

| Route | Method | Auth Required | Description |
|-------|--------|---------------|-------------|
| `/auth/register` | POST | No | Create new account, send welcome email |
| `/auth/login` | POST | No | Authenticate, return JWT token + userId |

### Request/Response Formats

#### POST /auth/register

**Request:**
```json
{
  "login": "johndoe",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "0612345678"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "userId": "uuid-here",
    "token": "jwt-token-here"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": {
    "code": "USER_ALREADY_EXISTS",
    "message": "A user with this login already exists"
  }
}
```

#### POST /auth/login

**Request:**
```json
{
  "login": "johndoe",
  "password": "SecurePass123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "uuid-here",
    "token": "jwt-token-here"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid login or password"
  }
}
```

---

## Request Flow

```
HTTP POST /auth/register
        │
        ▼
┌─────────────────────┐
│   auth.routes.ts    │  Route definition
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  auth.validator.ts  │  Zod validation (passwords match, email format, etc.)
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│ auth.controller.ts  │  Extracts data, resolves use case from container
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│ register.use_case.ts│  Business logic orchestration
└─────────────────────┘
        │
        ├──────────────────────────────────────┐
        ▼                                      ▼
┌─────────────────────┐              ┌─────────────────────┐
│ user.repository.ts  │ (interface)  │ password.service.ts │ (interface)
└─────────────────────┘              └─────────────────────┘
        │                                      │
        ▼                                      ▼
┌─────────────────────────┐          ┌─────────────────────────┐
│prisma_user.repository.ts│          │argon_password.service.ts│
└─────────────────────────┘          └─────────────────────────┘
        │
        ▼
┌─────────────────────┐
│  email.service.ts   │ (interface)
└─────────────────────┘
        │
        ▼
┌─────────────────────────┐
│resend_email.service.ts  │  Sends welcome email
└─────────────────────────┘
        │
        ▼
┌─────────────────────┐
│  response.util.ts   │  Formats JSON response
└─────────────────────┘
        │
        ▼
HTTP 201 { success: true, data: { userId, token } }
```

---

## Test Plan

### Unit Tests

| File | Test Cases |
|------|------------|
| `register.use_case.test.ts` | Valid registration, duplicate login error, passwords don't match, email service called |
| `login.use_case.test.ts` | Valid credentials, wrong password, user not found, token generated |
| `argon_password.service.test.ts` | Hash returns string, verify correct password, verify wrong password |
| `resend_email.service.test.ts` | Send email success, send email failure handling |

### Integration Tests

| File | Test Cases |
|------|------------|
| `auth.routes.test.ts` | Full HTTP flow: register success, register duplicate, login success, login wrong password, validation errors |
| `auth.middleware.test.ts` | Valid token passes, invalid token rejected, missing token rejected |
| `prisma_user.repository.test.ts` | Create user, find by login, find by id |

### Test Setup

```typescript
// tests/setup.ts
import 'reflect-metadata'
import { container } from 'tsyringe'
import { TOKENS } from '../src/infrastructure/di/tokens'

// Reset container before each test
beforeEach(() => {
  container.clearInstances()
})

// Register mock implementations for unit tests
export function registerMocks() {
  container.register(TOKENS.UserRepository, { useValue: mockUserRepository })
  container.register(TOKENS.EmailService, { useValue: mockEmailService })
  container.register(TOKENS.PasswordService, { useValue: mockPasswordService })
}
```

---

## Environment Variables

```env
# .env.example

# Database
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# JWT
JWT_SECRET="your-super-secret-key-min-32-chars"
JWT_EXPIRES_IN="24h"

# Resend
RESEND_API_KEY="re_xxxxxxxxxxxx"
RESEND_FROM_EMAIL="noreply@yourdomain.com"

# Server
PORT=3000
NODE_ENV="development"
```

---

## Dependencies

### Production

```json
{
  "dependencies": {
    "hono": "^4.x",
    "@hono/node-server": "^1.x",
    "@prisma/client": "^5.x",
    "zod": "^3.x",
    "argon2": "^0.31.x",
    "resend": "^2.x",
    "tsyringe": "^4.x",
    "reflect-metadata": "^0.2.x"
  }
}
```

### Development

```json
{
  "devDependencies": {
    "typescript": "^5.x",
    "prisma": "^5.x",
    "vitest": "^1.x",
    "@types/node": "^20.x",
    "tsx": "^4.x"
  }
}
```

---

## TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules', 'tests']
    }
  }
})
```

---

## Scripts

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push"
  }
}
```

---

## Phase 2 (Future)

Once Phase 1 is complete, extend with:

- User profile management (CRUD)
- Car and Brand entities
- City reference data
- Trip management
- Reservation system
- Email notifications for reservations