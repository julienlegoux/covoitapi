# Logger Implementation Report

> Audit date: 2026-02-12

---

## 1. Architecture Overview

The project uses a **custom structured logger** (no external library like Winston or Pino).

| File | Role |
|------|------|
| `src/lib/logging/logger.types.ts` | Interface definitions (`Logger`, `LogEntry`, `LogFormatter`, `LogLevel`) |
| `src/lib/logging/logger.ts` | `StructuredLogger` implementation, formatters, singleton export |
| `src/lib/logging/index.ts` | Barrel re-export |
| `src/lib/context/request-context.ts` | `AsyncLocalStorage`-backed per-request context (`requestId`, `userId`) |
| `src/presentation/middleware/request-logger.middleware.ts` | HTTP request/response logging middleware |

---

## 2. What Works Well

- **Clean interface abstraction** -- `Logger` interface in `logger.types.ts` separates contract from implementation.
- **Environment-aware formatting** -- `JsonFormatter` (production, machine-readable) vs `PrettyFormatter` (development, colorized ANSI).
- **Log-level filtering** -- Reads `LOG_LEVEL` env var; defaults to `"info"` in production and `"debug"` in development.
- **Request context enrichment** -- `AsyncLocalStorage` automatically injects `requestId` and `userId` into every log entry.
- **Error serialization** -- Errors are serialized to `{ name, message, stack, code }` for structured output.
- **Child logger support** -- `logger.child({ service: 'auth' })` creates scoped loggers with inherited context.
- **Factory function** -- `createLogger(context?)` available for creating fresh instances.
- **Unit tests exist** -- `src/lib/logging/logger.test.ts` covers the core logger behavior.

---

## 3. Issues Found

### 3.1 CRITICAL -- Request Logger Middleware Is Never Mounted

**File:** `src/presentation/middleware/request-logger.middleware.ts`

The middleware is fully implemented (generates `X-Request-Id`, logs request/response with timing) but it is **never registered** in the application router.

**Current state of `src/presentation/routes/index.ts`:**
```ts
app.use('*', bodyLimit({ maxSize: 1024 * 1024 }));
app.use('*', errorHandler);
// requestLogger is NOT here
```

**Impact:**
- No HTTP request/response logging in production.
- `AsyncLocalStorage` context is never initialized, so `requestId` and `userId` are always `undefined` in all log entries.
- The `X-Request-Id` header is never set on responses.
- The entire request-context system (`src/lib/context/request-context.ts`) is effectively dead code at runtime.

### 3.2 HIGH -- Logger Not Registered in DI Container

The logger is exported as a module-level singleton (`export const logger`) and imported directly. It is **not** registered in the tsyringe DI container alongside repositories and services.

**`src/lib/shared/di/tokens.ts`** has no `Logger` token.
**`src/lib/shared/di/container.ts`** has no logger registration.

**Impact:**
- Inconsistent with the project's DI pattern (every other cross-cutting concern uses tsyringe).
- Use cases cannot receive a mock logger via DI -- makes unit testing of logging behavior harder.
- The `RegisterUseCase` imports logger directly instead of injecting it.

### 3.3 HIGH -- Extremely Low Logger Adoption Across the Codebase

Out of **32 use cases**, only **1** uses the logger:

| File | Uses Logger |
|------|-------------|
| `src/application/use-cases/auth/register.use-case.ts` | `logger.warn(...)` for email failure |
| All other 31 use cases | No logging at all |

**Files that import the logger (total: 4):**

| File | Usage |
|------|-------|
| `src/index.ts:10` | `logger.info('Server initialized', ...)` |
| `src/presentation/middleware/error-handler.middleware.ts:82` | `logger.error('Unexpected error', ...)` |
| `src/presentation/middleware/request-logger.middleware.ts:46,61` | Request/response logging (but middleware is never mounted) |
| `src/application/use-cases/auth/register.use-case.ts:103` | `logger.warn('Failed to send welcome email', ...)` |

**Missing logging in critical areas:**
- Login attempts (success/failure) -- no audit trail
- User deletion / anonymization -- no audit trail
- Driver creation -- no logging
- Travel creation/deletion -- no logging
- Inscription creation/deletion -- no logging
- Repository errors -- silently returned as `Result` types, never logged

### 3.4 MEDIUM -- `createLogger()` Factory Is Exported but Never Used

**File:** `src/lib/logging/logger.ts:204`

```ts
export function createLogger(context?: Record<string, unknown>): Logger {
    return new StructuredLogger(context);
}
```

Exported from `src/lib/logging/index.ts:7` but only used in test files (`logger.test.ts`). No application code calls it.

### 3.5 LOW -- `console.log` in Utility Scripts

Raw `console.log` / `console.error` calls exist in standalone CLI scripts. This is acceptable since they run outside the application runtime, but noted for completeness:

| File | Count |
|------|-------|
| `src/infrastructure/database/prisma/seed.ts` | 5 calls |
| `src/infrastructure/database/prisma/export.ts` | 1 call |
| `src/infrastructure/database/prisma/check-size.ts` | 1 call |

No inappropriate `console.log` calls exist in application code.

---

## 4. Redundancy Analysis

| Item | Status |
|------|--------|
| Duplicate logger implementations | None -- single `StructuredLogger` class |
| Duplicate logger instances | None -- single singleton at `logger.ts:197` |
| Redundant log calls | None -- logging is too sparse to have redundancy |
| Overlapping formatters | No -- `JsonFormatter` and `PrettyFormatter` serve different environments |

**No redundancy issues found.** The problem is the opposite -- severe under-utilization.

---

## 5. Unused / Dead Code

| Code | File | Status |
|------|------|--------|
| `requestLogger` middleware | `request-logger.middleware.ts` | Defined, exported, **never mounted** |
| `createLogger()` factory | `logger.ts:204` | Exported, only used in tests |
| `runWithContext()` | `request-context.ts:83` | Only called from the unmounted middleware |
| `updateContext()` | `request-context.ts:67` | Never called anywhere |
| `generateRequestId()` | `request-context.ts:35` | Only called internally by `createContext()`, which is only called by `runWithContext()` |
| `getContext()` | `request-context.ts:58` | Called by logger + unmounted middleware, but always returns `undefined` at runtime since context is never initialized |
| `createContext()` | `request-context.ts:44` | Only called by `runWithContext()` |

The entire `request-context.ts` module is effectively dead code because the middleware that initializes it is never mounted.

---

## 6. Summary Table

| Category | Verdict |
|----------|---------|
| Interface design | Good |
| Implementation quality | Good |
| Environment awareness | Good |
| Test coverage (logger itself) | Good |
| Middleware integration | **Not wired up** |
| DI integration | **Missing** |
| Adoption across codebase | **Very low (4 files / 32 use cases untouched)** |
| Request context at runtime | **Dead (never initialized)** |
| Redundancy | None |
| Unused exports | `createLogger`, `updateContext`, `generateRequestId` |

---

## 7. Recommended Actions

### Must Fix
1. **Mount `requestLogger` middleware** in `src/presentation/routes/index.ts` before other middleware so request context and HTTP logging actually work.
2. **Add logging to critical use cases** -- at minimum: login (success/failure), user deletion, driver creation, travel CRUD.

### Should Fix
3. **Register logger in the DI container** with a `TOKENS.Logger` symbol so use cases can receive it via `@inject()` and tests can provide mocks.
4. **Remove or mark as intentional** the unused exports (`createLogger`, `updateContext`, `generateRequestId`) to avoid confusion.

### Nice to Have
5. Consider adding a log aggregation transport (file, Datadog, Sentry) for production -- currently console-only, logs are lost on process restart.
6. Add structured error IDs in error responses that correlate to log entries for customer support debugging.
