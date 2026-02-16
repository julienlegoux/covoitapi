import { raw } from 'hono/html';

export const ErdSection = () => (
  <section id="erd">
    <div class="container">
      <h2><span class="num">05</span>ERD — Modèle Conceptuel de Données</h2>
      <p class="section-desc">Schéma entité-relation avec cardinalités pour la base Neon PostgreSQL.</p>

      <div class="diagram-card">
        <div class="mermaid">{raw(`
erDiagram
    AUTH {
        uuid id PK
        int ref_id UK
        string email UK
        string password
        enum role
        datetime anonymized_at
        datetime created_at
        datetime updated_at
    }

    USER {
        uuid id PK
        int ref_id UK
        string first_name
        string last_name
        string phone
        int auth_ref_id FK
        datetime anonymized_at
        datetime created_at
        datetime updated_at
    }

    DRIVER {
        uuid id PK
        int ref_id UK
        string driver_license UK
        int user_ref_id FK
        datetime anonymized_at
    }

    TRAVEL {
        uuid id PK
        int ref_id UK
        datetime date_route
        int kms
        int seats
        int driver_ref_id FK
        int car_ref_id FK
    }

    INSCRIPTION {
        uuid id PK
        int ref_id UK
        int user_ref_id FK
        int route_ref_id FK
        enum status
        datetime created_at
    }

    CITY {
        uuid id PK
        int ref_id UK
        string city_name
        string zipcode
    }

    CITY_TRAVEL {
        int route_ref_id PK
        int city_ref_id PK
        enum type
    }

    CAR {
        uuid id PK
        int ref_id UK
        string immat UK
        int model_ref_id FK
    }

    MODEL {
        uuid id PK
        int ref_id UK
        string name
        int brand_ref_id FK
    }

    BRAND {
        uuid id PK
        int ref_id UK
        string name
    }

    COLOR {
        uuid id PK
        int ref_id UK
        string name
        string hex
    }

    COLOR_MODEL {
        int color_ref_id PK
        int model_ref_id PK
    }

    AUTH ||--|| USER : "authentifie (1,1)"
    USER ||--o| DRIVER : "devient (0,1)"
    USER ||--o{ INSCRIPTION : "reserve (0,n)"
    DRIVER ||--o{ TRAVEL : "publie (0,n)"
    TRAVEL ||--o{ INSCRIPTION : "contient (0,n)"
    TRAVEL ||--|{ CITY_TRAVEL : "depart et arrivee (1,2)"
    TRAVEL }o--|| CAR : "utilise (1,1)"
    CITY ||--o{ CITY_TRAVEL : "reference (0,n)"
    CAR }o--|| MODEL : "modele (1,1)"
    MODEL }o--|| BRAND : "marque (1,1)"
    MODEL ||--o{ COLOR_MODEL : "disponible (0,n)"
    COLOR ||--o{ COLOR_MODEL : "associe (0,n)"
        `)}</div>
      </div>
    </div>
  </section>
);
