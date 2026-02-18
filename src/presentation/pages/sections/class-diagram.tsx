import { raw } from 'hono/html';

export const ClassDiagramSection = () => (
  <section id="class">
    <div class="container">
      <h2><span class="num">03</span>Diagramme de Classes</h2>
      <p class="section-desc">Relations entre les classes du domaine métier avec multiplicités.</p>

      <div class="diagram-card">
        <div class="mermaid">{raw(`
classDiagram
    class Auth {
        +UUID id
        +Int refId
        +String email
        +String password
        +Role role
        +DateTime anonymizedAt
        +register(email, password) Auth
        +login(email, password) Token
    }

    class User {
        +UUID id
        +Int refId
        +String firstName
        +String lastName
        +String phone
        +Int authRefId
        +DateTime anonymizedAt
        +updateProfile() User
        +anonymize() void
    }

    class Driver {
        +UUID id
        +Int refId
        +String driverLicense
        +Int userRefId
        +DateTime anonymizedAt
        +create(driverLicense) Driver
    }

    class Travel {
        +UUID id
        +Int refId
        +DateTime dateRoute
        +Int kms
        +Int seats
        +Int driverRefId
        +Int carRefId
        +create() Travel
        +delete() void
        +search(departure, arrival, date) Travel[]
    }

    class Inscription {
        +UUID id
        +Int refId
        +Int userRefId
        +Int routeRefId
        +InscriptionStatus status
        +DateTime createdAt
        +create() Inscription
        +delete() void
    }

    class City {
        +UUID id
        +Int refId
        +String cityName
        +String zipcode
        +create() City
        +delete() void
    }

    class CityTravel {
        +Int routeRefId
        +Int cityRefId
        +CityTravelType type
    }

    class Car {
        +UUID id
        +Int refId
        +String immat
        +Int modelRefId
        +create() Car
        +update() Car
        +delete() void
    }

    class Model {
        +UUID id
        +Int refId
        +String name
        +Int brandRefId
    }

    class Brand {
        +UUID id
        +Int refId
        +String name
        +create() Brand
        +delete() void
    }

    class Color {
        +UUID id
        +Int refId
        +String name
        +String hex
        +create() Color
        +update() Color
        +delete() void
    }

    Auth "1" --> "1" User : authentifie
    User "1" --> "0..1" Driver : devient conducteur
    User "1" --> "*" Inscription : reserve
    Driver "1" --> "*" Travel : publie
    Travel "1" --> "*" Inscription : contient
    Travel "1" --> "2" CityTravel : depart et arrivee
    Travel "*" --> "1" Car : utilise
    City "1" --> "*" CityTravel : reference
    Car "*" --> "1" Model : est un modele
    Model "*" --> "1" Brand : est de marque
    Model "*" --> "*" Color : disponible en
        `)}</div>
      </div>
    </div>
  </section>
);
