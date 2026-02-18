import { raw } from 'hono/html';

const MermaidDiagram = ({ chart }: { chart: string }) => (
  <div class="diagram-card">
    <div class="mermaid">{raw(chart)}</div>
  </div>
);

export const SequencesSection = () => (
  <section id="sequence">
    <div class="container">
      <h2><span class="num">04</span>Diagrammes de Séquence</h2>
      <p class="section-desc">Flux d'interactions détaillés pour chaque cas d'utilisation principal.</p>

      <h3>Sequence — Authentification (Login)</h3>
      <MermaidDiagram chart={`
sequenceDiagram
    actor U as Utilisateur
    participant App as Application Mobile
    participant API as API REST Hono
    participant DB as Neon PostgreSQL

    U->>App: Saisit email + password
    App->>API: POST /api/auth/login {email, password}
    API->>DB: SELECT auth WHERE email = ?
    DB-->>API: Auth trouve
    alt Password correct (Argon2)
        API->>API: Genere token JWT
        API-->>App: 200 {token, userId}
        App-->>U: Redirection Accueil
    else Password incorrect
        API-->>App: 401 {error INVALID_CREDENTIALS}
        App-->>U: Affiche message erreur
    end
      `} />

      <h3>Sequence — Inscription (Register)</h3>
      <MermaidDiagram chart={`
sequenceDiagram
    actor U as Utilisateur
    participant App as Application Mobile
    participant API as API REST Hono
    participant DB as Neon PostgreSQL

    U->>App: Saisit email, password, confirmPassword
    App->>API: POST /api/auth/register {email, password, confirmPassword}
    API->>API: Validation Zod (email, password min 8 chars)
    alt Validation echouee
        API-->>App: 400 {error VALIDATION_ERROR}
        App-->>U: Affiche erreurs
    else Validation OK
        API->>DB: SELECT auth WHERE email = ?
        alt Email deja utilise
            API-->>App: 409 {error USER_ALREADY_EXISTS}
        else Email disponible
            API->>API: Hash password (Argon2)
            API->>DB: INSERT INTO auths + INSERT INTO users
            DB-->>API: Auth + User crees
            API->>API: Genere token JWT
            API-->>App: 201 {token, userId}
            App-->>U: Redirection Accueil
        end
    end
      `} />

      <h3>Sequence — Liste des Trajets</h3>
      <MermaidDiagram chart={`
sequenceDiagram
    actor U as Utilisateur
    participant App as Application Mobile
    participant API as API REST Hono
    participant DB as Neon PostgreSQL

    U->>App: Accede a la liste des trajets
    App->>API: GET /api/travels?page=1&limit=10 (x-auth-token)
    API->>API: authMiddleware verifie JWT
    alt Token valide
        API->>API: requireRole USER
        API->>DB: SELECT travels + JOIN driver, car, cities
        DB-->>API: Liste paginee des trajets
        API-->>App: 200 {items, total, page, limit}
        App-->>U: Affiche liste des trajets
    else Token invalide
        API-->>App: 401 {error UNAUTHORIZED}
    end
      `} />

      <h3>Sequence — Detail Trajet</h3>
      <MermaidDiagram chart={`
sequenceDiagram
    actor U as Utilisateur
    participant App as Application Mobile
    participant API as API REST Hono
    participant DB as Neon PostgreSQL

    U->>App: Clic sur un trajet
    App->>API: GET /api/travels/:id (x-auth-token)
    API->>API: authMiddleware + requireRole USER
    API->>DB: SELECT travel WHERE id + JOIN driver, car, cities
    DB-->>API: Detail du trajet complet
    API-->>App: 200 {travel + driver + car + cities}
    App-->>U: Affiche detail du trajet
      `} />

      <h3>Sequence — Reserver une Place</h3>
      <MermaidDiagram chart={`
sequenceDiagram
    actor U as Utilisateur
    participant App as Application Mobile
    participant API as API REST Hono
    participant DB as Neon PostgreSQL

    U->>App: Clic Reserver
    App->>API: POST /api/inscriptions {travelId} (x-auth-token)
    API->>API: authMiddleware + requireRole USER
    API->>DB: SELECT travel WHERE id = travelId
    DB-->>API: Travel trouve
    API->>DB: COUNT inscriptions WHERE routeRefId = ?
    DB-->>API: Nombre de reservations

    alt Places disponibles et pas deja inscrit
        API->>DB: INSERT INTO inscriptions
        DB-->>API: Inscription creee
        API-->>App: 201 {inscription}
        App-->>U: Reservation effectuee
    else Deja inscrit
        API-->>App: 409 {error ALREADY_INSCRIBED}
        App-->>U: Deja inscrit a ce trajet
    else Plus de place
        API-->>App: 400 {error NO_SEATS_AVAILABLE}
        App-->>U: Reservation impossible
    end
      `} />

      <h3>Sequence — Rechercher un Trajet</h3>
      <MermaidDiagram chart={`
sequenceDiagram
    actor U as Utilisateur
    participant App as Application Mobile
    participant API as API REST Hono
    participant DB as Neon PostgreSQL

    U->>App: Saisit ville depart, ville arrivee, date
    App->>API: GET /api/travels/search?departureCity=X&arrivalCity=Y&date=Z
    API->>API: authMiddleware + requireRole USER
    API->>DB: SELECT travels WHERE cities match AND date
    DB-->>API: Resultats
    API-->>App: 200 [{travel1}, {travel2}, ...]
    App-->>U: Affiche resultats de recherche
      `} />

      <h3>Sequence — Publier un Trajet (Conducteur)</h3>
      <MermaidDiagram chart={`
sequenceDiagram
    actor D as Conducteur
    participant App as Application Mobile
    participant API as API REST Hono
    participant DB as Neon PostgreSQL

    D->>App: Saisit depart, arrivee, date, kms, seats, carId
    App->>API: POST /api/travels {kms, date, departureCity, arrivalCity, seats, carId}
    API->>API: authMiddleware + requireRole DRIVER
    API->>API: Validation Zod
    API->>DB: INSERT INTO routes + city_routes
    DB-->>API: Travel cree
    API-->>App: 201 {travel + driver + car + cities}
    App-->>D: Redirection vers Mes Trajets
      `} />

      <h3>Sequence — Supprimer un Trajet (Conducteur)</h3>
      <MermaidDiagram chart={`
sequenceDiagram
    actor D as Conducteur
    participant App as Application Mobile
    participant API as API REST Hono
    participant DB as Neon PostgreSQL

    D->>App: Clic Supprimer le trajet
    App->>API: DELETE /api/travels/:id (x-auth-token)
    API->>API: authMiddleware + requireRole DRIVER
    API->>DB: DELETE FROM routes WHERE id (CASCADE inscriptions + city_routes)
    DB-->>API: OK
    API-->>App: 204 No Content
    App-->>D: Redirection vers Mes Trajets
      `} />

      <h3>Sequence — Devenir Conducteur</h3>
      <MermaidDiagram chart={`
sequenceDiagram
    actor U as Utilisateur
    participant App as Application Mobile
    participant API as API REST Hono
    participant DB as Neon PostgreSQL

    U->>App: Saisit numero de permis
    App->>API: POST /api/drivers {driverLicense} (x-auth-token)
    API->>API: authMiddleware + requireRole USER
    alt Deja conducteur
        API-->>App: 409 {error DRIVER_ALREADY_EXISTS}
    else Nouveau conducteur
        API->>DB: INSERT INTO drivers
        DB-->>API: Driver cree
        API->>DB: UPDATE auth SET role = DRIVER
        DB-->>API: Role mis a jour
        API-->>App: 201 {driver}
        App-->>U: Statut conducteur active
    end
      `} />

      <h3>Sequence — Anonymisation RGPD</h3>
      <MermaidDiagram chart={`
sequenceDiagram
    actor U as Utilisateur
    participant App as Application Mobile
    participant API as API REST Hono
    participant DB as Neon PostgreSQL

    U->>App: Demande suppression de compte
    App->>API: DELETE /api/users/me (x-auth-token)
    API->>API: authMiddleware + requireRole USER
    API->>DB: UPDATE user SET anonymizedAt, clear personal data
    DB-->>API: OK
    API->>DB: UPDATE auth SET anonymizedAt, clear email/password
    DB-->>API: OK
    API->>DB: UPDATE inscriptions SET status ANONYMIZED
    DB-->>API: OK
    API-->>App: 204 No Content
    App-->>U: Compte anonymise
      `} />
    </div>
  </section>
);
