# CovoitAPI v1 — Frontend Integration Guide

## Base URL

```
/api/v1
```

## Global Middleware

All routes are protected by:

| Middleware | Description |
|---|---|
| `secureHeaders()` | Standard security headers |
| `cors({ origin: '*' })` | CORS open to all origins |
| `requestLogger` | Logs every request/response |
| `bodyLimit` | 1 MB max request body |
| `errorHandler` | Catches validation, domain & unknown errors |

## Authentication

Protected endpoints require the header:

```
x-auth-token: <JWT>
```

Obtain the token via **Register** or **Login**.

### Role Hierarchy

```
USER  <  DRIVER  <  ADMIN
```

A DRIVER has all USER permissions. An ADMIN has all DRIVER + USER permissions.

---

## Response Envelope

### Success

```json
{
  "success": true,
  "data": "<varies by endpoint>"
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {}
  }
}
```

`details` is optional and contains field-level validation errors when `code` is `VALIDATION_ERROR`:

```json
{
  "details": {
    "email": ["Invalid email format"],
    "password": ["Must contain at least 1 uppercase letter"]
  }
}
```

### Pagination Envelope

Paginated endpoints wrap data in:

```json
{
  "success": true,
  "data": {
    "data": [],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 42,
      "totalPages": 3
    }
  }
}
```

Default: `page=1`, `limit=20`. Max limit: `100`.

### Common HTTP Status Codes

| Code | Meaning |
|---|---|
| `200` | OK (GET, PATCH, PUT) |
| `201` | Created (POST) |
| `204` | No Content (DELETE) |
| `400` | Validation / bad input |
| `401` | Missing or invalid token |
| `403` | Insufficient permissions / not owner |
| `404` | Resource not found |
| `409` | Conflict (duplicate) |
| `429` | Rate limited |
| `500` | Internal server error |

---

## 1. Auth — `/api/v1/auth`

### `POST /auth/register`

> **Public** | Rate limit: **3 req/min**

Register a new account. Creates an Auth + User in one transaction.

**Request Body**

```json
{
  "email": "user@example.com",
  "password": "Str0ngP@ss",
  "confirmPassword": "Str0ngP@ss"
}
```

| Field | Type | Rules |
|---|---|---|
| `email` | `string` | Valid email format |
| `password` | `string` | Min 8 chars, 1 lowercase, 1 uppercase, 1 digit |
| `confirmPassword` | `string` | Must match `password` |

**201 — Success**

```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "token": "jwt-string"
  }
}
```

**Errors**: `400 VALIDATION_ERROR` · `409 USER_ALREADY_EXISTS` · `429 RATE_LIMITED`

---

### `POST /auth/login`

> **Public** | Rate limit: **5 req/min**

**Request Body**

```json
{
  "email": "user@example.com",
  "password": "Str0ngP@ss"
}
```

**200 — Success**

```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "token": "jwt-string"
  }
}
```

**Errors**: `400 VALIDATION_ERROR` · `401 INVALID_CREDENTIALS` · `429 RATE_LIMITED`

---

## 2. Users — `/api/v1/users`

### `GET /users`

> **Auth: ADMIN**

List all users.

**200 — Success**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "refId": 1,
      "firstName": "John",
      "lastName": "Doe",
      "phone": "0612345678",
      "email": "john@example.com",
      "authRefId": 1,
      "anonymizedAt": null,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### `GET /users/:id`

> **Auth: USER+** — own profile, or **ADMIN** for any user

**Path Params**: `id` — User UUID

**200 — Success**: Single user object (same shape as above).

**Errors**: `403 FORBIDDEN` · `404 USER_NOT_FOUND`

---

### `PATCH /users/me`

> **Auth: USER+**

Update the authenticated user's profile.

**Request Body**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "0612345678"
}
```

| Field | Type | Rules |
|---|---|---|
| `firstName` | `string` | Required |
| `lastName` | `string` | Required |
| `phone` | `string` | Required, min 10 chars |

**200 — Success**: Updated user object.

**Errors**: `400 VALIDATION_ERROR` · `404 USER_NOT_FOUND`

---

### `DELETE /users/me`

> **Auth: USER+**

GDPR self-service anonymization. Irreversible.

**204 — No Content**

---

### `DELETE /users/:id`

> **Auth: ADMIN**

Anonymize any user.

**Path Params**: `id` — User UUID

**204 — No Content**

**Errors**: `404 USER_NOT_FOUND`

---

## 3. Drivers — `/api/v1/drivers`

### `POST /drivers`

> **Auth: USER+**

Promote the authenticated user to DRIVER.

**Request Body**

```json
{
  "driverLicense": "ABC123456789"
}
```

| Field | Type | Rules |
|---|---|---|
| `driverLicense` | `string` | Non-empty license number |

**201 — Success**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "refId": 1,
    "driverLicense": "ABC123456789",
    "userRefId": 1,
    "anonymizedAt": null
  }
}
```

**Errors**: `400 VALIDATION_ERROR` · `404 USER_NOT_FOUND` · `409 DRIVER_ALREADY_EXISTS`

---

## 4. Brands — `/api/v1/brands`

### `GET /brands`

> **Auth: DRIVER+** | Paginated

List car brands.

**Query Params**: `?page=1&limit=20`

**200 — Success** (paginated)

```json
{
  "data": [
    { "id": "uuid", "refId": 1, "name": "Toyota" }
  ],
  "meta": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 }
}
```

---

### `POST /brands`

> **Auth: ADMIN**

**Request Body**

```json
{ "name": "Toyota" }
```

**201 — Success**: Brand object.

**Errors**: `400 VALIDATION_ERROR` · `409 CONFLICT`

---

### `DELETE /brands/:id`

> **Auth: ADMIN**

**Path Params**: `id` — Brand UUID

**204 — No Content**

**Errors**: `404 BRAND_NOT_FOUND`

---

## 5. Colors — `/api/v1/colors`

### `GET /colors`

> **Auth: DRIVER+** | Paginated

**Query Params**: `?page=1&limit=20`

**200 — Success** (paginated)

```json
{
  "data": [
    { "id": "uuid", "refId": 1, "name": "Red", "hex": "#FF0000" }
  ],
  "meta": { ... }
}
```

---

### `POST /colors`

> **Auth: ADMIN**

**Request Body**

```json
{ "name": "Red", "hex": "#FF0000" }
```

| Field | Type | Rules |
|---|---|---|
| `name` | `string` | Non-empty |
| `hex` | `string` | Format: `#RRGGBB` |

**201 — Success**: Color object.

**Errors**: `400 VALIDATION_ERROR` · `409 COLOR_ALREADY_EXISTS`

---

### `PATCH /colors/:id`

> **Auth: ADMIN**

Partial update.

**Request Body**

```json
{ "name": "Dark Red", "hex": "#8B0000" }
```

All fields optional.

**200 — Success**: Updated color object.

**Errors**: `400 VALIDATION_ERROR` · `404 COLOR_NOT_FOUND`

---

### `DELETE /colors/:id`

> **Auth: ADMIN**

**Path Params**: `id` — Color UUID

**204 — No Content**

**Errors**: `404 COLOR_NOT_FOUND`

---

## 6. Cities — `/api/v1/cities`

### `GET /cities`

> **Auth: USER+** | Paginated

**Query Params**: `?page=1&limit=20`

**200 — Success** (paginated)

```json
{
  "data": [
    { "id": "uuid", "refId": 1, "cityName": "Paris", "zipcode": "75000" }
  ],
  "meta": { ... }
}
```

---

### `POST /cities`

> **Auth: USER+**

**Request Body**

```json
{ "cityName": "Paris", "zipcode": "75000" }
```

**201 — Success**: City object.

**Errors**: `400 VALIDATION_ERROR`

---

### `DELETE /cities/:id`

> **Auth: ADMIN**

**Path Params**: `id` — City UUID

**204 — No Content**

**Errors**: `404 CITY_NOT_FOUND`

---

## 7. Cars — `/api/v1/cars`

All car routes require **DRIVER+**. Mutation routes verify **ownership**.

### `GET /cars`

> **Auth: DRIVER+** | Paginated

**Query Params**: `?page=1&limit=20`

**200 — Success** (paginated)

```json
{
  "data": [
    {
      "id": "uuid",
      "refId": 1,
      "licensePlate": "AB-123-CD",
      "modelRefId": 1,
      "driverRefId": 1
    }
  ],
  "meta": { ... }
}
```

---

### `POST /cars`

> **Auth: DRIVER+**

Create a car linked to the authenticated driver.

**Request Body**

```json
{
  "model": "Corolla",
  "brandId": "brand-uuid",
  "licensePlate": "AB-123-CD"
}
```

| Field | Type | Rules |
|---|---|---|
| `model` | `string` | Car model name |
| `brandId` | `string` | UUID of an existing brand |
| `licensePlate` | `string` | License plate number |

**201 — Success**: Car object.

**Errors**: `400 VALIDATION_ERROR` · `404 NOT_FOUND` (brand)

---

### `PUT /cars/:id`

> **Auth: DRIVER+** | Owner only

Full replacement.

**Path Params**: `id` — Car UUID

**Request Body**: Same as `POST /cars`.

**200 — Success**: Updated car object.

**Errors**: `400 VALIDATION_ERROR` · `403 FORBIDDEN` · `404 CAR_NOT_FOUND`

---

### `PATCH /cars/:id`

> **Auth: DRIVER+** | Owner only

Partial update. All fields optional.

**Path Params**: `id` — Car UUID

**Request Body**

```json
{
  "model": "Yaris",
  "brandId": "brand-uuid",
  "licensePlate": "EF-456-GH"
}
```

**200 — Success**: Updated car object.

**Errors**: `400 VALIDATION_ERROR` · `403 FORBIDDEN` · `404 CAR_NOT_FOUND`

---

### `DELETE /cars/:id`

> **Auth: DRIVER+** | Owner only

**Path Params**: `id` — Car UUID

**204 — No Content**

**Errors**: `403 FORBIDDEN` · `404 CAR_NOT_FOUND`

---

## 8. Trips — `/api/v1/trips`

### `GET /trips`

> **Auth: USER+**

List all available trips.

**200 — Success**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "refId": 1,
      "dateTrip": "2025-06-15T00:00:00.000Z",
      "kms": 350,
      "seats": 3,
      "driverRefId": 1,
      "carRefId": 1
    }
  ]
}
```

---

### `GET /trips/search`

> **Auth: USER+**

Search for trips.

**Query Params**

| Param | Type | Required | Description |
|---|---|---|---|
| `departureCity` | `string` | No | Departure city name |
| `arrivalCity` | `string` | No | Arrival city name |
| `date` | `string` | No | Date (`YYYY-MM-DD`) |

**200 — Success**: Array of matching trip objects.

---

### `GET /trips/:id`

> **Auth: USER+**

Get a single trip.

**Path Params**: `id` — Trip UUID

**200 — Success**: Single trip object.

**Errors**: `404 TRIP_NOT_FOUND`

---

### `POST /trips`

> **Auth: DRIVER+**

Create a new trip. The authenticated driver is set as the trip owner.

**Request Body**

```json
{
  "kms": 350,
  "date": "2025-06-15",
  "departureCity": "Paris",
  "arrivalCity": "Lyon",
  "seats": 3,
  "carId": "car-uuid"
}
```

| Field | Type | Rules |
|---|---|---|
| `kms` | `number` | Positive integer |
| `date` | `string` | Date string |
| `departureCity` | `string` | City name or identifier |
| `arrivalCity` | `string` | City name or identifier |
| `seats` | `number` | Positive integer |
| `carId` | `string` | UUID of the driver's car |

**201 — Success**: Trip object.

**Errors**: `400 VALIDATION_ERROR` · `404 NOT_FOUND` (car or city)

---

### `DELETE /trips/:id`

> **Auth: DRIVER+** | Owner only

**Path Params**: `id` — Trip UUID

**204 — No Content**

**Errors**: `403 FORBIDDEN` · `404 TRIP_NOT_FOUND`

---

## 9. Inscriptions — `/api/v1/inscriptions`

Inscriptions represent a user booking a seat on a trip.

### `GET /inscriptions`

> **Auth: USER+** | Paginated

List all inscriptions.

**Query Params**: `?page=1&limit=20`

**200 — Success** (paginated)

```json
{
  "data": [
    {
      "id": "uuid",
      "refId": 1,
      "createdAt": "2025-06-01T10:00:00.000Z",
      "userRefId": 1,
      "tripRefId": 1,
      "status": "PENDING"
    }
  ],
  "meta": { ... }
}
```

---

### `GET /users/:id/inscriptions`

> **Auth: USER+** — own inscriptions, or **ADMIN**

List inscriptions for a specific user.

**Path Params**: `id` — User UUID

**Query Params**: `?page=1&limit=20`

**200 — Success**: Paginated inscription array.

**Errors**: `403 FORBIDDEN` · `404 USER_NOT_FOUND`

---

### `GET /trips/:id/passengers`

> **Auth: USER+**

List all passengers inscribed to a trip.

**Path Params**: `id` — Trip UUID

**Query Params**: `?page=1&limit=20`

**200 — Success**: Paginated inscription array.

---

### `POST /inscriptions`

> **Auth: USER+**

Book a seat on a trip.

**Request Body**

```json
{ "tripId": "trip-uuid" }
```

**201 — Success**: Inscription object.

**Errors**: `400 VALIDATION_ERROR` · `404 TRIP_NOT_FOUND` · `409 INSCRIPTION_ALREADY_EXISTS`

---

### `DELETE /inscriptions/:id`

> **Auth: USER+**

Cancel an inscription.

**Path Params**: `id` — Inscription UUID

**204 — No Content**

**Errors**: `404 INSCRIPTION_NOT_FOUND`

---

## Quick Reference Table

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register |
| `POST` | `/auth/login` | Public | Login |
| `GET` | `/users` | ADMIN | List users |
| `GET` | `/users/:id` | USER+ | Get user |
| `PATCH` | `/users/me` | USER+ | Update own profile |
| `DELETE` | `/users/me` | USER+ | Anonymize self |
| `DELETE` | `/users/:id` | ADMIN | Anonymize user |
| `POST` | `/drivers` | USER+ | Become a driver |
| `GET` | `/brands` | DRIVER+ | List brands |
| `POST` | `/brands` | ADMIN | Create brand |
| `DELETE` | `/brands/:id` | ADMIN | Delete brand |
| `GET` | `/colors` | DRIVER+ | List colors |
| `POST` | `/colors` | ADMIN | Create color |
| `PATCH` | `/colors/:id` | ADMIN | Update color |
| `DELETE` | `/colors/:id` | ADMIN | Delete color |
| `GET` | `/cities` | USER+ | List cities |
| `POST` | `/cities` | USER+ | Create city |
| `DELETE` | `/cities/:id` | ADMIN | Delete city |
| `GET` | `/cars` | DRIVER+ | List cars |
| `POST` | `/cars` | DRIVER+ | Create car |
| `PUT` | `/cars/:id` | DRIVER+ | Replace car |
| `PATCH` | `/cars/:id` | DRIVER+ | Update car |
| `DELETE` | `/cars/:id` | DRIVER+ | Delete car |
| `GET` | `/trips` | USER+ | List trips |
| `GET` | `/trips/search` | USER+ | Search trips |
| `GET` | `/trips/:id` | USER+ | Get trip |
| `POST` | `/trips` | DRIVER+ | Create trip |
| `DELETE` | `/trips/:id` | DRIVER+ | Delete trip |
| `GET` | `/inscriptions` | USER+ | List inscriptions |
| `GET` | `/users/:id/inscriptions` | USER+ | User's inscriptions |
| `GET` | `/trips/:id/passengers` | USER+ | Trip passengers |
| `POST` | `/inscriptions` | USER+ | Book a trip |
| `DELETE` | `/inscriptions/:id` | USER+ | Cancel booking |

---

## Typical Frontend Flows

### 1. Registration → Profile Setup → Browse Trips

```
POST /auth/register        → get token
PATCH /users/me            → set firstName, lastName, phone
GET /cities                → populate city dropdowns
GET /trips/search?...      → search available trips
POST /inscriptions         → book a seat
```

### 2. Become a Driver → Add Car → Create Trip

```
POST /drivers              → register as driver (role upgrades to DRIVER)
GET /brands                → populate brand dropdown
POST /cars                 → add a car
GET /cities                → populate city dropdowns
POST /trips                → create a trip
```

### 3. View My Bookings

```
GET /users/:myId/inscriptions  → list my inscriptions
GET /trips/:tripId             → get trip details for each
```
