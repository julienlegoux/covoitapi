# 🔒 Security Audit — CovoitAPI

**Date:** 2026-02-12  
**Scope:** Full codebase review (`src/`, config files, env handling, Prisma schema, seed script)  
**Stack:** Hono · TypeScript · Prisma + Neon Postgres · Argon2 · JWT HS256 · Zod · Resend

---

## Executive Summary

The codebase shows a clean architecture with good separation of concerns and several solid security practices (Argon2id hashing, Zod validation, structured error handling that hides internals). However, **multiple critical and high-severity issues** exist around broken access control, missing infrastructure protections, and hardcoded credentials.

---

## 🔴 Critical

### C1 — IDOR: Any Driver Can Delete/Modify Any Car

**Files:** [car.controller.ts](file:///c:/Users/lgxju/Project/covoitapi/src/presentation/controllers/car.controller.ts) · [delete-car.use-case.ts](file:///c:/Users/lgxju/Project/covoitapi/src/application/use-cases/car/delete-car.use-case.ts)

The `DELETE /api/v1/cars/:id`, `PUT /api/v1/cars/:id`, and `PATCH /api/v1/cars/:id` endpoints only check that the user has DRIVER role. **No ownership check is performed.** Any authenticated driver can delete or modify any other driver's car.

```typescript
// car.controller.ts — no userId check
export async function deleteCar(c: Context): Promise<Response> {
    const id = c.req.param('id');               // ← attacker-controlled
    const useCase = container.resolve(DeleteCarUseCase);
    const result = await useCase.execute(id);   // ← no ownership verification
}
```

> [!CAUTION]
> **Impact:** A malicious driver can enumerate car UUIDs and delete every car in the system, disrupting all travels.

**Fix:** Pass `userId` from context to the use case and verify the car belongs to the requesting driver before mutation.

---

### C2 — IDOR: Any Driver Can Delete Any Travel

**Files:** [route.controller.ts](file:///c:/Users/lgxju/Project/covoitapi/src/presentation/controllers/route.controller.ts) · [delete-travel.use-case.ts](file:///c:/Users/lgxju/Project/covoitapi/src/application/use-cases/travel/delete-travel.use-case.ts)

Same pattern as C1. `DELETE /api/v1/travels/:id` requires DRIVER role but doesn't verify the travel belongs to the requesting driver.

```typescript
// route.controller.ts
export async function deleteRoute(c: Context): Promise<Response> {
    const id = c.req.param('id');
    const useCase = container.resolve(DeleteTravelUseCase);
    const result = await useCase.execute(id); // ← no ownership check
}
```

> [!CAUTION]
> **Impact:** A driver can cancel other drivers' trips, affecting all passengers inscribed to those travels (cascading delete on inscriptions via FK).

---

### C3 — IDOR: Any User Can Delete Any Inscription

**Files:** [inscription.controller.ts](file:///c:/Users/lgxju/Project/covoitapi/src/presentation/controllers/inscription.controller.ts#L119-L127) · [delete-inscription.use-case.ts](file:///c:/Users/lgxju/Project/covoitapi/src/application/use-cases/inscription/delete-inscription.use-case.ts)

`DELETE /api/v1/inscriptions/:id` requires USER role but doesn't verify the inscription belongs to the requesting user.

```typescript
// inscription.controller.ts
export async function deleteInscription(c: Context): Promise<Response> {
    const id = c.req.param('id');
    const useCase = container.resolve(DeleteInscriptionUseCase);
    const result = await useCase.execute(id); // ← any user can cancel anyone's booking
}
```

---

## 🟠 High

### H1 — No Rate Limiting on Auth Endpoints

**Files:** [auth.routes.ts](file:///c:/Users/lgxju/Project/covoitapi/src/presentation/routes/auth.routes.ts) · [index.ts](file:///c:/Users/lgxju/Project/covoitapi/src/presentation/routes/index.ts)

There is **no rate limiting** anywhere in the application — not on login, registration, or any other endpoint. This makes the API vulnerable to:

- **Credential stuffing / brute-force** attacks on `POST /api/v1/auth/login`
- **Account enumeration** (the `USER_ALREADY_EXISTS` error on registration reveals whether an email is registered)
- **DoS** via expensive Argon2 hashing on registration endpoint

> [!IMPORTANT]
> At minimum, apply rate limiting to `/auth/login` and `/auth/register`. Consider using `hono-rate-limiter` or a reverse proxy (Cloudflare, nginx).

---

### H2 — No CORS Configuration

**No CORS middleware is configured anywhere** in the application. This is confirmed by searching the entire `src/` directory for "cors" with zero results.

Without explicit CORS headers, the browser's same-origin policy may block legitimate frontend requests, while a misconfigured deployment could allow arbitrary origins to make authenticated requests.

**Fix:** Add `hono/cors` middleware with an explicit allowlist:
```typescript
import { cors } from 'hono/cors';
app.use('*', cors({ origin: ['https://yourdomain.com'] })); // should be set to * until the frontend is deployed
```

---

## 🟡 Medium

### M1 — User Data Enumeration

**File:** [user.routes.ts](file:///c:/Users/lgxju/Project/covoitapi/src/presentation/routes/user.routes.ts#L33)

`GET /api/v1/users/:id` requires only USER role. **Any authenticated user can look up any other user's profile** by UUID, including their first name, last name, phone number, and email.

Similarly, `GET /api/v1/users/:id/inscriptions` lets any user view another user's travel inscriptions.

**Fix:** Either restrict `/:id` to the user's own profile (compare `c.get('userId')` with param `id`) or scope the returned fields.

---

### M2 — Missing Security Headers

No `helmet`-style middleware sets security headers. The API doesn't send:
- `Strict-Transport-Security` (HSTS)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Content-Security-Policy`

**Fix:** Use Hono's `secureHeaders` middleware:
```typescript
import { secureHeaders } from 'hono/secure-headers';
app.use('*', secureHeaders());
```

---

### M3 — JWT Has No `iss`/`aud`/`jti` Claims

**File:** [hono-jwt.service.ts](file:///c:/Users/lgxju/Project/covoitapi/src/infrastructure/services/hono-jwt.service.ts#L58-L68)

The JWT payload only contains `userId`, `role`, and `exp`. Missing standard claims:
- **`iss` (issuer)** — prevents token confusion between services
- **`aud` (audience)** — ensures tokens are used in the right context
- **`jti` (JWT ID)** — enables token revocation/replay protection

Without `jti`, there is no mechanism for token revocation — a compromised token stays valid until expiry.

---

### M4 — Color/Brand CRUD Open to Any Driver

**Files:** [color.routes.ts](file:///c:/Users/lgxju/Project/covoitapi/src/presentation/routes/color.routes.ts) · [brand.routes.ts](file:///c:/Users/lgxju/Project/covoitapi/src/presentation/routes/brand.routes.ts)

- **Colors:** `POST /create`, `PATCH /:id`, `DELETE /:id` all require only DRIVER role. Any driver can create, modify, or delete colors used across the system.
- **Brands:** Create/delete correctly requires ADMIN, but this inconsistency with colors suggests an oversight.

---

### M5 — Email HTML Injection

**File:** [resend-email.service.ts](file:///c:/Users/lgxju/Project/covoitapi/src/infrastructure/services/resend-email.service.ts#L52-L56)

```typescript
html: `<h1>Welcome, ${firstName}!</h1>
       <p>Thank you for joining our carpooling platform.</p>`
```

The `firstName` value is interpolated directly into HTML without sanitization. While at registration `firstName` is null, the profile update allows setting arbitrary strings. If a user sets their first name to `<script>alert(1)</script>` and triggers the welcome email path (unlikely but possible with re-registration logic), this could inject HTML into emails.

---

## 🔵 Low / Informational


### L2 — No Request ID Validation on Route Parameters

Route parameters like `:id` are used directly without UUID format validation:
```typescript
const id = c.req.param('id'); // Could be any string, not validated as UUID
```

While Prisma will reject invalid UUIDs at the DB level, this wastes a database round-trip. Validate UUIDs at the schema/middleware level.

### L4 — No Token Refresh Mechanism

JWTs expire after 24h (configurable) but there is no refresh token flow. Users must re-authenticate with credentials after token expiry, which may encourage long-lived tokens or storing passwords client-side.

---

## ✅ What's Done Well

| Area | Assessment |
|------|-----------|
| **Password Hashing** | Argon2id with default params — OWASP recommended ✅ |
| **Error Handling** | Structured errors, internal details hidden on 500 ✅ |
| **Login Failure** | Generic `InvalidCredentialsError` for all paths (no user enumeration on login) ✅ |
| **Zod Validation** | All inputs validated before use-case execution ✅ |
| **Body Limit** | 1 MB global limit prevents large payload attacks ✅ |
| **Request Correlation** | UUID-based `X-Request-Id` for debugging ✅ |
| **DI Architecture** | Clean abstraction boundaries allow easy testing ✅ |
| **GDPR Anonymization** | Self-service deletion + admin deletion with `anonymizedAt` ✅ |
| **Password Policy** | 8+ chars, uppercase, lowercase, digit ✅ |

---

## Priority Fix Order

| Priority | Issue | Effort |
|----------|-------|--------|
| 1 | C1-C3: IDOR ownership checks | Medium |
| 2 | H1: Rate limiting on auth | Low |
| 3 | H2: CORS configuration | Low |
| 4 | M1: User data access scoping | Medium |
| 5 | M2: Security headers | Low |
| 6 | M3: JWT claims enrichment | Low |
| 7 | M4: Color CRUD permissions | Low |
