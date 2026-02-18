# VP Routes vs Spec — Comparison Analysis

Comparison of `src/presentation/vp/` implementation against `soutenance-4-covoiturage-greta.md`.

Legend: ✅ Match | ⚠️ Difference | ❌ Missing/Wrong

---

## 1. Authentification

| | Spec | Implementation | Status |
|---|---|---|---|
| `POST /register` body | `{ email, password }` | `{ firstname, lastname, phone, email, password }` | ⚠️ **Extra fields**: `firstname`, `lastname`, `phone` not in spec |
| `POST /login` body | `{ email, password }` | `{ email, password }` | ✅ |

> **Note:** The spec treats registration as email+password only, with person details added later via `POST /persons`. The VP implementation combines both into a single registration step.

---

## 2. Cars (Véhicules)

| | Spec | Implementation | Status |
|---|---|---|---|
| `POST /cars` body | `{ model, seats, brand, carregistration }` | `{ model, brand, carregistration }` | ❌ **Missing `seats`** |
| `PUT /cars/{id}` body | `{ model, seats, brand, carregistration }` | `{ model, brand, carregistration }` | ❌ **Missing `seats`** |
| `GET /cars` | User + Admin | requireRole('USER') | ✅ |
| `GET /cars/{id}` | User + Admin | requireRole('USER') | ✅ |
| `DELETE /cars/{id}` | User (own) + Admin | requireRole('USER') | ✅ |

**Issues:**
- `seats` field is completely absent from `vpCreateCarSchema` ([schemas.ts:31-35](src/presentation/vp/schemas.ts#L31-L35))
- The spec requires `seats` for both creation and update of cars

---

## 3. Persons (Utilisateurs)

| | Spec | Implementation | Status |
|---|---|---|---|
| `GET /persons` | **NON** (User) / OUI (Admin) | requireRole('USER') | ⚠️ **Should be ADMIN only** |
| `GET /persons/{id}` | User + Admin | requireRole('USER') | ✅ |
| `GET /persons/{id}/trips-driver` | User + Admin | requireRole('USER') | ✅ |
| `GET /persons/{id}/trips-passenger` | User + Admin | requireRole('USER') | ✅ |
| `POST /persons` body | `{ firstname, lastname, phone }` | `{ firstname, lastname, phone, email, password }` | ⚠️ **Extra fields**: `email`, `password` |
| `POST /persons` auth | User (own) + Admin | **No auth required** (public) | ⚠️ **No auth** |
| `PATCH /persons/{id}` body | `{ firstname, lastname, phone, status }` | `{ firstname, lastname, phone, status }` | ✅ |
| `DELETE /persons/{id}` | **NON** (User) / OUI (Admin) | requireRole('USER') | ⚠️ **Should be ADMIN only** |

**Issues:**
- `GET /persons` is accessible to any USER — spec says Admin only ([routes.ts:23](src/presentation/vp/routes.ts#L23))
- `DELETE /persons/{id}` is accessible to any USER — spec says Admin only ([routes.ts:26](src/presentation/vp/routes.ts#L26))
- `POST /persons` requires no auth and expects email+password (acting as a second register endpoint) ([routes.ts:22](src/presentation/vp/routes.ts#L22))

---

## 4. Brands (Marques)

| | Spec | Implementation | Status |
|---|---|---|---|
| `GET /brands` | No auth columns filled | requireRole('USER') | ⚠️ Spec implies public access |
| `POST /brands` body | `{ name }` | `{ name }` | ✅ |
| `POST /brands` auth | Admin only | requireRole('ADMIN') | ✅ |
| `PUT /brands/{id}` body | `{ name }` | `{ name }` | ✅ |
| `PUT /brands/{id}` auth | Admin only | requireRole('ADMIN') | ✅ |
| `DELETE /brands/{id}` | Admin only | requireRole('ADMIN') | ✅ |

**Minor:** `GET /brands` has no User/Admin columns filled in the spec, suggesting it might be public. Implementation requires USER auth.

---

## 5. Trips (Trajets)

| | Spec | Implementation | Status |
|---|---|---|---|
| `GET /trips` query | `startingcity, arrivalcity, tripdate` | `startingcity, arrivalcity, tripdate` | ✅ |
| `GET /trips/{id}` | User + Admin | requireRole('USER') | ✅ |
| `GET /trips/{id}/person` | User (associated) + Admin | requireRole('USER') | ✅ |
| `POST /trips` body | `{ kms, person_id, trip_datetime, available_seats, starting_address{...}, arrival_address{...} }` | `{ kms, person_id, trip_datetime, seats, car_id, starting_address{...}, arrival_address{...} }` | ⚠️ See below |
| `PATCH /trips/{id}` body | Full body (same as POST) | `{ kms, trip_datetime, seats }` | ⚠️ **Partial**: missing addresses, person_id |
| `DELETE /trips/{id}` | cascade + email notification | requireRole('USER') | ⚠️ **No email notification implemented** |

**POST /trips issues:**
- Field name: spec uses `available_seats`, implementation uses `seats`
- Extra field: `car_id` in implementation is not in spec

**PATCH /trips issues:**
- Spec expects the same full body as POST (including addresses)
- Implementation only accepts `{ kms, trip_datetime, seats }` — no address updates possible
- Field name: `available_seats` vs `seats` (same as POST)

**DELETE /trips:**
- Spec mentions cascade deletion + email notification to passengers — unclear if implemented

---

## 6. Réservation

| | Spec | Implementation | Status |
|---|---|---|---|
| `POST /trips/{id}/person` body | `{ person_id: 123 }` (number) | `{ person_id: "uuid-string" }` (string) | ⚠️ **Type differs**: spec shows number, impl uses UUID string |
| `POST /trips/{id}/person` auth | No columns filled | requireRole('USER') | ✅ (reasonable) |

---

## Résumé des écarts

### Champs manquants / incorrects
1. **Cars: champ `seats` manquant** dans `vpCreateCarSchema` — affecte `POST /cars` et `PUT /cars`
2. **Trips: `available_seats` renommé en `seats`** — nom de champ différent du spec
3. **Trips: champ `car_id` en plus** dans `POST /trips` — absent du spec
4. **Trips PATCH: body trop limité** — le spec attend le body complet avec les adresses

### Erreurs d'autorisation
5. **`GET /persons`** : accessible à USER, le spec dit Admin uniquement
6. **`DELETE /persons/{id}`** : accessible à USER, le spec dit Admin uniquement
7. **`POST /persons`** : public (pas d'auth), le spec dit User (soi-même) / Admin

### Différences de schéma / body
8. **`POST /register`** : inclut `firstname, lastname, phone` — le spec n'attend que `email, password`
9. **`POST /persons`** : inclut `email, password` — le spec n'attend que `firstname, lastname, phone`
10. **`POST /trips/{id}/person`** : `person_id` est un string (UUID), le spec montre un number (123)

### Fonctionnalités manquantes
11. **`DELETE /trips/{id}`** : le spec demande une suppression cascade + envoi d'email aux passagers concernés
12. **`GET /brands`** : le spec implique un accès public, l'implémentation exige USER auth
