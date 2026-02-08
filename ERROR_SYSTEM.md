# Error System — Full Architecture Tour

## Overview

The project has **two parallel error-handling paths** that coexist:

1. **Result-based (railway-oriented)** — the primary path for all expected business outcomes
2. **Exception-based (middleware catch-all)** — the fallback for thrown errors (mainly Zod validation)

---

## Path 1: Result-Based (Railway-Oriented)

This is the **primary** path. Errors are values, not exceptions. They flow through `Result<T, E>` from repository → use case → controller → HTTP response.

### Layer 1 — Repository (bottom of the stack)

Every repository method wraps Prisma calls in try/catch and returns `Result<T, DatabaseError>` instead of throwing:

```typescript
// src/infrastructure/database/repositories/prisma-inscription.repository.ts
async findAll(): Promise<Result<InscriptionEntity[], DatabaseError>> {
    try {
        const inscriptions = await this.prisma.inscription.findMany(...)
        return ok(inscriptions)            // ← success rail
    } catch (e) {
        return err(new DatabaseError(...)) // ← error rail
    }
}
```

`DatabaseError` extends `RepositoryError` extends `InfrastructureError` — all defined in `src/infrastructure/errors/`. They carry a `.code` string like `'DATABASE_ERROR'`.

### Layer 2 — Use Case (business logic)

Use cases chain multiple `Result` values. They check `result.success` at each step and short-circuit by returning the error:

```typescript
// src/application/use-cases/inscription/create-inscription.use-case.ts
const routeResult = await this.routeRepository.findById(input.idtrajet);
if (!routeResult.success) return routeResult;     // ← pass DB error up

if (!routeResult.value)
    return err(new RouteNotFoundError(...));        // ← domain error
```

Domain errors like `RouteNotFoundError`, `AlreadyInscribedError`, `NoSeatsAvailableError` are created here. They extend `DomainError` and also carry a `.code` string (e.g. `'ROUTE_NOT_FOUND'`).

The return type unions both:
```typescript
Result<InscriptionEntity, RouteNotFoundError | AlreadyInscribedError | ... | RepositoryError>
```

### Layer 3 — Controller (presentation)

Controllers call the use case and pass the `Result` to `resultToResponse()`:

```typescript
// src/presentation/controllers/inscription.controller.ts
const result = await useCase.execute(input);
return resultToResponse(c, result, 201);
```

### Layer 4 — `resultToResponse()` (the bridge to HTTP)

This function in `src/lib/shared/utils/result-response.util.ts` converts a `Result` into an HTTP response:

```typescript
if (result.success)
    return c.json({ success: true, data: result.value }, 200)

// On error, look up the HTTP status from the error's .code:
const httpStatus = getHttpStatus(result.error.code)  // ← uses the error registry
return c.json({ success: false, error: { code, message } }, httpStatus)
```

It calls `getHttpStatus()` from the **error registry** (`src/infrastructure/errors/error-registry.ts`) which maps every error code string to an HTTP status:

```typescript
ErrorCodes = {
    ROUTE_NOT_FOUND:    { httpStatus: 404, category: 'domain' },
    ALREADY_INSCRIBED:  { httpStatus: 409, category: 'domain' },
    DATABASE_ERROR:     { httpStatus: 500, category: 'infrastructure' },
    // ...
}
```

Unknown codes default to 500.

### Path 1 — Visual Flow

```
Repository           Use Case              Controller         resultToResponse
   │                    │                      │                     │
   ├─ ok(data) ────────►├─ ok(data) ──────────►├── result ──────────►├─ 200 JSON
   │                    │                      │                     │
   └─ err(DBError) ────►├─ return err ────────►│                     ├─ 500 JSON
                        │                      │                     │
                        └─ err(DomainError) ──►│                     └─ 404/409 JSON
                                                                         ▲
                                                                    error-registry
                                                                    maps .code → HTTP
```

---

## Path 2: Exception-Based (Middleware Catch-All)

This is the **fallback** for things that escape the Result system.

### What throws?

Only one thing in the normal flow: **Zod validation** in controllers.

```typescript
// src/presentation/controllers/inscription.controller.ts
const validated = createInscriptionSchema.parse(body);  // ← throws ZodError
```

`.parse()` throws a `ZodError` if validation fails. This is **not** wrapped in a Result.

### The catch-all middleware

`src/presentation/middleware/error-handler.middleware.ts` wraps `await next()` in a try/catch:

```typescript
try {
    await next();
} catch (error) {
    const response = buildErrorResponse(error);
    const status = getStatusCode(error);
    return c.json(response, status);
}
```

It uses `instanceof` checks to determine the response:

| Error type | Code | HTTP Status |
|---|---|---|
| `ZodError` | `'VALIDATION_ERROR'` | 400, with field-level `details` |
| `DomainError` | `error.code` | Hardcoded switch (404, 409, 401, 400) |
| `ApplicationError` | `error.code` | Hardcoded switch (400, 404) |
| Anything else | `'INTERNAL_ERROR'` | 500 |

The `ZodError` branch formats field-level details:
```typescript
// Groups issues by field path
{ "email": ["Invalid email"], "password": ["Too short"] }
```

---

## The Redundancy

The `DomainError` and `ApplicationError` branches in the error handler middleware **duplicate** the logic in the error registry.

The **error registry** says:
```typescript
USER_NOT_FOUND → 404
ALREADY_INSCRIBED → 409
```

The **error handler middleware** also says:
```typescript
case 'USER_NOT_FOUND': return 404
case 'ALREADY_INSCRIBED': return 409
```

Same mapping, written twice, in two different formats. The registry is used by `resultToResponse()` (Path 1). The switch statement is used by the middleware (Path 2). If a new domain error is added, **both** need updating.

In practice, `DomainError` instances are almost never thrown — they're returned via `err()`. The middleware's `DomainError` branch is a safety net that would only fire if someone accidentally `throw`s instead of `return err(...)`.

---

## Error Class Hierarchy

```
Error
├── DomainError (.code)                        ← src/domain/errors/
│   ├── UserAlreadyExistsError
│   ├── InvalidCredentialsError
│   ├── UserNotFoundError
│   ├── BrandNotFoundError
│   ├── CityNotFoundError
│   ├── CarNotFoundError
│   ├── CarAlreadyExistsError
│   ├── DriverNotFoundError
│   ├── DriverAlreadyExistsError
│   ├── RouteNotFoundError
│   ├── InscriptionNotFoundError
│   ├── AlreadyInscribedError
│   └── NoSeatsAvailableError
│
├── ApplicationError (.code)                   ← src/application/errors/  (⚠️ UNUSED)
│   ├── ValidationError                           never instantiated
│   └── NotFoundError                             never instantiated
│
├── InfrastructureError (.code, .cause)        ← src/infrastructure/errors/
│   ├── RepositoryError
│   │   ├── DatabaseError
│   │   └── ConnectionError
│   ├── EmailError
│   │   ├── EmailDeliveryError
│   │   └── EmailConfigError
│   ├── PasswordError
│   │   ├── HashingError
│   │   └── HashVerificationError
│   ├── JwtError
│   │   ├── TokenExpiredError
│   │   ├── TokenInvalidError
│   │   ├── TokenMalformedError
│   │   └── TokenSigningError
│   └── ContextError
│       └── ContextNotFoundError
│
└── ZodError                                   ← thrown by .parse(), caught by middleware
```

---

## File Map

| File | Role |
|---|---|
| `src/lib/shared/types/result.ts` | The `Result<T, E>` type + helpers (`ok`, `err`, `map`, `flatMap`, etc.) |
| `src/domain/errors/domain.errors.ts` | Business rule violation errors (13 classes) |
| `src/application/errors/application.errors.ts` | Generic app errors — **unused** |
| `src/infrastructure/errors/infrastructure.error.ts` | Base class for infra errors |
| `src/infrastructure/errors/repository.errors.ts` | DB-level errors (`DatabaseError`, `ConnectionError`) |
| `src/infrastructure/errors/email.errors.ts` | Email service errors |
| `src/infrastructure/errors/jwt.errors.ts` | Token errors |
| `src/infrastructure/errors/password.errors.ts` | Hashing errors |
| `src/infrastructure/errors/context.errors.ts` | AsyncLocalStorage errors |
| `src/infrastructure/errors/error-registry.ts` | Maps error `.code` → HTTP status (used by Path 1) |
| `src/presentation/middleware/error-handler.middleware.ts` | Catch-all for thrown errors (Path 2) |
| `src/lib/shared/utils/result-response.util.ts` | Converts `Result` → HTTP response using the registry |
| `src/presentation/types/error.types.ts` | `ErrorResponse` shape type |

---

## How to Add a New Error

1. **Create the error class** in the appropriate layer:
   - Business rule → `src/domain/errors/domain.errors.ts` (extend `DomainError`)
   - Infra failure → `src/infrastructure/errors/` (extend `InfrastructureError`)

2. **Register its code** in `src/infrastructure/errors/error-registry.ts`:
   ```typescript
   MY_NEW_ERROR: { code: 'MY_NEW_ERROR', httpStatus: 400, category: 'domain' },
   ```

3. **Add it to the middleware switch** in `src/presentation/middleware/error-handler.middleware.ts` (due to the redundancy):
   ```typescript
   case 'MY_NEW_ERROR': return 400;
   ```

4. **Use it** in a use case via `return err(new MyNewError(...))`.

> **Note:** Step 3 could be eliminated by refactoring the middleware to use the error registry instead of a hardcoded switch. This would make the registry the single source of truth for error code → HTTP status mapping.
