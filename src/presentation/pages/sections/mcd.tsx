import { raw } from 'hono/html';

export const McdSection = () => (
  <section id="mcd">
    <div class="container">
      <h2><span class="num">05</span>MCD — Modèle Conceptuel de Données</h2>
      <p class="section-desc">Schéma conceptuel Merise avec cardinalités pour la base Neon PostgreSQL.</p>

      <div class="diagram-card">
        <div class="mermaid">{raw(`
erDiagram
    AUTH {
        string email UK
        string password
        enum role
        datetime anonymized_at
    }

    USER {
        string first_name
        string last_name
        string phone
        datetime anonymized_at
    }

    DRIVER {
        string driver_license UK
        datetime anonymized_at
    }

    TRIP {
        datetime date_trip
        int kms
        int seats
    }

    INSCRIPTION {
        enum status
        datetime created_at
    }

    CITY {
        string city_name
        string zipcode
    }

    CITY_TRIP {
        enum type
    }

    CAR {
        string immat UK
        int seats
    }

    MODEL {
        string name
    }

    BRAND {
        string name
    }

    COLOR {
        string name
        string hex
    }

    COLOR_MODEL {
        string _
    }

    AUTH ||--|| USER : "authentifie (1,1)"
    USER ||--o| DRIVER : "devient (0,1)"
    USER ||--o{ INSCRIPTION : "reserve (0,n)"
    DRIVER ||--o{ TRIP : "publie (0,n)"
    DRIVER ||--o{ CAR : "possede (0,n)"
    TRIP ||--o{ INSCRIPTION : "contient (0,n)"
    TRIP ||--|{ CITY_TRIP : "etape (1,n)"
    TRIP }o--|| CAR : "utilise (1,1)"
    CITY ||--o{ CITY_TRIP : "reference (0,n)"
    CAR }o--|| MODEL : "modele (1,1)"
    MODEL }o--|| BRAND : "marque (1,1)"
    MODEL ||--o{ COLOR_MODEL : "disponible (0,n)"
    COLOR ||--o{ COLOR_MODEL : "associe (0,n)"
        `)}</div>
      </div>
    </div>
  </section>
);
