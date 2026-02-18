# Soutenance 4 - Covoiturage GRETA

## Endpoints API

### Authentification

| Verbe HTTP | Route | Query Params (optionnels) | Body (JSON) | User | Admin | Notes |
|------------|-------|--------------------------|-------------|------|-------|-------|
| `POST` | `/register` | | `{ "email": "...", "password": "..." }` | ​ | ​ | |
| `POST` | `/login` | | `{ "email": "...", "password": "..." }` | ​ | ​ | |

### Cars (Véhicules)

| Verbe HTTP | Route | Query Params (optionnels) | Body (JSON) | User | Admin | Notes |
|------------|-------|--------------------------|-------------|------|-------|-------|
| `POST` | `/cars` | | `{ "model": "...", "seats": "...", "brand": "...", "carregistration": "..." }` | OUI (uniquement pour soi) | OUI (uniquement pour soi) | Optionnel : ajouter un champ pour décrire le véhicule |
| `GET` | `/cars` | | | OUI | OUI | |
| `GET` | `/cars/{id}` | | | OUI | OUI | |
| `PUT` | `/cars/{id}` | | `{ "model": "...", "seats": "...", "brand": "...", "carregistration": "..." }` | OUI (uniquement pour son véhicule) | OUI | |
| `DELETE` | `/cars/{id}` | | | OUI (uniquement pour son véhicule) | OUI | |

### Persons (Utilisateurs)

| Verbe HTTP | Route | Query Params (optionnels) | Body (JSON) | User | Admin | Notes |
|------------|-------|--------------------------|-------------|------|-------|-------|
| `GET` | `/persons` | | | NON | OUI | |
| `GET` | `/persons/{id}` | | | OUI | OUI | |
| `GET` | `/persons/{id}/trips-driver` | | | OUI | OUI | Récupère les trajets où l'utilisateur a été conducteur |
| `GET` | `/persons/{id}/trips-passenger` | | | OUI | OUI | Récupère les trajets où l'utilisateur a été passager |
| `POST` | `/persons` | | `{ "firstname": "...", "lastname": "...", "phone": "..." }` | OUI (uniquement pour soi) | OUI | Pseudo inutile ? |
| `PATCH` | `/persons/{id}` | | `{ "firstname": "...", "lastname": "...", "phone": "...", "status": "..." }` | OUI (uniquement pour soi) | OUI | Passer par le champ "status" pour appliquer un flag "DELETED" sur le compte |
| `DELETE` | `/persons/{id}` | | | NON | OUI | |

### Brands (Marques)

| Verbe HTTP | Route | Query Params (optionnels) | Body (JSON) | User | Admin | Notes |
|------------|-------|--------------------------|-------------|------|-------|-------|
| `GET` | `/brands` | | | | | |
| `DELETE` | `/brands/{id}` | | | NON | OUI | FACULTATIF |
| `POST` | `/brands` | | `{ "name": "..." }` | NON | OUI | FACULTATIF |
| `PUT` | `/brands/{id}` | | `{ "name": "..." }` | NON | OUI | FACULTATIF |

### Trips (Trajets)

| Verbe HTTP | Route | Query Params (optionnels) | Body (JSON) | User | Admin | Notes |
|------------|-------|--------------------------|-------------|------|-------|-------|
| `GET` | `/trips` | `startingcity`, `arrivalcity`, `tripdate` | | OUI | OUI | |
| `GET` | `/trips/{id}` | | | OUI | OUI | |
| `GET` | `/trips/{id}/person` | | | OUI (uniquement les personnes associées à ce trajet) | OUI | Récupère les passagers du trajet |
| `POST` | `/trips` | | `{ "kms": "...", "person_id": "...", "trip_datetime": "...", "available_seats": "...", "starting_address": { "street_number": "...", "street_name": "...", "postal_code": "...", "city_name": "..." }, "arrival_address": { "street_number": "...", "street_name": "...", "postal_code": "...", "city_name": "..." } }` | OUI (uniquement avec le rôle conducteur) | OUI | Une personne est "conducteur" dès qu'elle possède une voiture |
| `PATCH` | `/trips/{id}` | | `{ "kms": "...", "person_id": "...", "trip_datetime": "...", "available_seats": "...", "starting_address": { "street_number": "...", "street_name": "...", "postal_code": "...", "city_name": "..." }, "arrival_address": { "street_number": "...", "street_name": "...", "postal_code": "...", "city_name": "..." } }` | OUI (conducteur du trajet uniquement) | OUI | |
| `DELETE` | `/trips/{id}` | | | | | Suppression cascade + envoi d'email pour prévenir les personnes qui étaient positionnées dessus |

### Réservation

| Verbe HTTP | Route | Query Params (optionnels) | Body (JSON) | User | Admin | Notes |
|------------|-------|--------------------------|-------------|------|-------|-------|
| `POST` | `/trips/{id}/person` | | `{ "person_id": 123 }` | | | Permet à l'utilisateur de réserver une place sur un trajet |
