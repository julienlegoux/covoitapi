import { raw } from 'hono/html';

export const ArchitectureSection = () => (
  <section id="archi">
    <div class="container">
      <h2><span class="num">07</span>Architecture Clean — Hono + Prisma + Neon</h2>
      <p class="section-desc">Organisation du projet en couches (Clean Architecture + SOLID) avec injection de dependances.</p>

      <div class="arch-grid">
        <div class="arch-card">
          <h4>Domain Layer</h4>
          <p>Entites metier pures, interfaces de repositories, et services abstraits. Aucune dependance externe. Contient <code>entities/</code>, <code>repositories/</code> (interfaces), <code>services/</code> (JwtService, PasswordService, EmailService, CacheService).</p>
        </div>
        <div class="arch-card">
          <h4>Application Layer</h4>
          <p>Use cases organises par domaine (auth, user, driver, trip, inscription, car, brand, city, color). Contient <code>use-cases/</code> et <code>schemas/</code> (Zod). Chaque use case a ses tests unitaires.</p>
        </div>
        <div class="arch-card">
          <h4>Infrastructure Layer</h4>
          <p>Implementations concretes : Prisma repositories, cached repositories (Upstash Redis), Argon2 password hashing, Hono JWT, Resend email. Contient <code>database/</code>, <code>cache/</code>, <code>services/</code>.</p>
        </div>
        <div class="arch-card">
          <h4>Presentation Layer</h4>
          <p>Routes Hono (versionnees /api/v1), controllers, middlewares (auth JWT, authorization par role, error handler, request logger). Contient <code>routes/</code>, <code>controllers/</code>, <code>middleware/</code>.</p>
        </div>
        <div class="arch-card">
          <h4>Lib (Shared)</h4>
          <p>Utilitaires partages : systeme d'erreurs type, logging structure, conteneur DI (<code>container.ts</code> + <code>tokens.ts</code>), types Result, pagination, et result-response.</p>
        </div>
      </div>

      <h3>Structure de Fichiers</h3>
      <div class="folder-tree">{raw(`
<span class="dir">src/</span>
├── <span class="file">index.ts</span>                           <span class="comment"># Point d entree Hono</span>
│
├── <span class="dir">domain/</span>                            <span class="comment"># Couche metier pure</span>
│   ├── <span class="dir">entities/</span>
│   │   ├── <span class="file">auth.entity.ts</span>
│   │   ├── <span class="file">user.entity.ts</span>
│   │   ├── <span class="file">driver.entity.ts</span>
│   │   ├── <span class="file">trip.entity.ts</span>
│   │   ├── <span class="file">inscription.entity.ts</span>
│   │   ├── <span class="file">car.entity.ts</span>
│   │   ├── <span class="file">model.entity.ts</span>
│   │   ├── <span class="file">brand.entity.ts</span>
│   │   ├── <span class="file">color.entity.ts</span>
│   │   ├── <span class="file">city.entity.ts</span>
│   │   └── <span class="file">city-trip.entity.ts</span>
│   ├── <span class="dir">repositories/</span>              <span class="comment"># Interfaces (contrats)</span>
│   │   ├── <span class="file">auth.repository.ts</span>
│   │   ├── <span class="file">user.repository.ts</span>
│   │   ├── <span class="file">driver.repository.ts</span>
│   │   ├── <span class="file">trip.repository.ts</span>
│   │   ├── <span class="file">inscription.repository.ts</span>
│   │   ├── <span class="file">car.repository.ts</span>
│   │   ├── <span class="file">model.repository.ts</span>
│   │   ├── <span class="file">brand.repository.ts</span>
│   │   ├── <span class="file">color.repository.ts</span>
│   │   └── <span class="file">city.repository.ts</span>
│   └── <span class="dir">services/</span>                  <span class="comment"># Interfaces services</span>
│       ├── <span class="file">jwt.service.ts</span>
│       ├── <span class="file">password.service.ts</span>
│       ├── <span class="file">email.service.ts</span>
│       └── <span class="file">cache.service.ts</span>
│
├── <span class="dir">application/</span>                       <span class="comment"># Use cases &amp; Schemas Zod</span>
│   ├── <span class="dir">schemas/</span>
│   │   ├── <span class="file">common.schema.ts</span>
│   │   ├── <span class="file">auth.schema.ts</span>
│   │   ├── <span class="file">user.schema.ts</span>
│   │   ├── <span class="file">driver.schema.ts</span>
│   │   ├── <span class="file">trip.schema.ts</span>
│   │   ├── <span class="file">inscription.schema.ts</span>
│   │   ├── <span class="file">car.schema.ts</span>
│   │   ├── <span class="file">brand.schema.ts</span>
│   │   ├── <span class="file">city.schema.ts</span>
│   │   └── <span class="file">color.schema.ts</span>
│   └── <span class="dir">use-cases/</span>
│       ├── <span class="dir">auth/</span>                  <span class="comment"># login, register</span>
│       ├── <span class="dir">user/</span>                  <span class="comment"># get, list, update, anonymize, delete</span>
│       ├── <span class="dir">driver/</span>                <span class="comment"># create-driver</span>
│       ├── <span class="dir">trip/</span>                  <span class="comment"># create, delete, find, get, list</span>
│       ├── <span class="dir">inscription/</span>           <span class="comment"># create, delete, list, user-inscriptions, trip-passengers</span>
│       ├── <span class="dir">car/</span>                   <span class="comment"># create, delete, list, update</span>
│       ├── <span class="dir">brand/</span>                 <span class="comment"># create, delete, list</span>
│       ├── <span class="dir">city/</span>                  <span class="comment"># create, delete, list</span>
│       └── <span class="dir">color/</span>                 <span class="comment"># create, delete, list, update</span>
│
├── <span class="dir">infrastructure/</span>                    <span class="comment"># Implementations concretes</span>
│   ├── <span class="dir">database/</span>
│   │   ├── <span class="dir">prisma/</span>
│   │   │   ├── <span class="file">schema.prisma</span>      <span class="comment"># Schema BDD Neon PostgreSQL</span>
│   │   │   ├── <span class="file">seed.ts</span>
│   │   │   ├── <span class="dir">migrations/</span>
│   │   │   └── <span class="dir">generated/</span>         <span class="comment"># Client Prisma genere</span>
│   │   └── <span class="dir">repositories/</span>
│   │       ├── <span class="file">prisma-auth.repository.ts</span>
│   │       ├── <span class="file">prisma-user.repository.ts</span>
│   │       ├── <span class="file">prisma-driver.repository.ts</span>
│   │       ├── <span class="file">prisma-trip.repository.ts</span>
│   │       ├── <span class="file">prisma-inscription.repository.ts</span>
│   │       ├── <span class="file">prisma-car.repository.ts</span>
│   │       ├── <span class="file">prisma-model.repository.ts</span>
│   │       ├── <span class="file">prisma-brand.repository.ts</span>
│   │       ├── <span class="file">prisma-color.repository.ts</span>
│   │       └── <span class="file">prisma-city.repository.ts</span>
│   ├── <span class="dir">cache/</span>                         <span class="comment"># Upstash Redis cache layer</span>
│   │   ├── <span class="file">cache.config.ts</span>
│   │   ├── <span class="file">cache.utils.ts</span>
│   │   ├── <span class="file">upstash-cache.service.ts</span>
│   │   └── <span class="dir">repositories/</span>          <span class="comment"># Cached repository decorators</span>
│   │       ├── <span class="file">cached-auth.repository.ts</span>
│   │       ├── <span class="file">cached-user.repository.ts</span>
│   │       ├── <span class="file">cached-driver.repository.ts</span>
│   │       ├── <span class="file">cached-trip.repository.ts</span>
│   │       ├── <span class="file">cached-inscription.repository.ts</span>
│   │       ├── <span class="file">cached-car.repository.ts</span>
│   │       ├── <span class="file">cached-model.repository.ts</span>
│   │       ├── <span class="file">cached-brand.repository.ts</span>
│   │       ├── <span class="file">cached-color.repository.ts</span>
│   │       └── <span class="file">cached-city.repository.ts</span>
│   └── <span class="dir">services/</span>
│       ├── <span class="file">argon-password.service.ts</span>  <span class="comment"># Argon2 hashing</span>
│       ├── <span class="file">hono-jwt.service.ts</span>        <span class="comment"># JWT generation/verification</span>
│       └── <span class="file">resend-email.service.ts</span>    <span class="comment"># Resend email integration</span>
│
├── <span class="dir">presentation/</span>                      <span class="comment"># Hono routes &amp; middlewares</span>
│   ├── <span class="dir">routes/</span>
│   │   ├── <span class="file">index.ts</span>               <span class="comment"># App setup, base path /api</span>
│   │   ├── <span class="dir">v1/</span>                    <span class="comment"># Routes versionnees /api/v1</span>
│   │   │   └── <span class="file">index.ts</span>
│   │   ├── <span class="file">auth.routes.ts</span>
│   │   ├── <span class="file">user.routes.ts</span>
│   │   ├── <span class="file">driver.routes.ts</span>
│   │   ├── <span class="file">trip.routes.ts</span>
│   │   ├── <span class="file">inscription.routes.ts</span>
│   │   ├── <span class="file">car.routes.ts</span>
│   │   ├── <span class="file">brand.routes.ts</span>
│   │   ├── <span class="file">city.routes.ts</span>
│   │   └── <span class="file">color.routes.ts</span>
│   ├── <span class="dir">controllers/</span>
│   │   ├── <span class="file">auth.controller.ts</span>
│   │   ├── <span class="file">user.controller.ts</span>
│   │   ├── <span class="file">driver.controller.ts</span>
│   │   ├── <span class="file">trip.controller.ts</span>
│   │   ├── <span class="file">brand.controller.ts</span>
│   │   ├── <span class="file">car.controller.ts</span>
│   │   ├── <span class="file">city.controller.ts</span>
│   │   ├── <span class="file">color.controller.ts</span>
│   │   └── <span class="file">inscription.controller.ts</span>
│   └── <span class="dir">middleware/</span>
│       ├── <span class="file">auth.middleware.ts</span>         <span class="comment"># Verifie x-auth-token JWT</span>
│       ├── <span class="file">authorization.middleware.ts</span> <span class="comment"># requireRole(USER/DRIVER/ADMIN)</span>
│       ├── <span class="file">error-handler.middleware.ts</span>
│       └── <span class="file">request-logger.middleware.ts</span>
│
└── <span class="dir">lib/</span>                               <span class="comment"># Utilitaires partages</span>
    ├── <span class="dir">context/</span>
    │   └── <span class="file">request-context.ts</span>
    ├── <span class="dir">errors/</span>                        <span class="comment"># Systeme d erreurs type</span>
    │   ├── <span class="file">domain.errors.ts</span>
    │   ├── <span class="file">repository.errors.ts</span>
    │   ├── <span class="file">infrastructure.error.ts</span>
    │   ├── <span class="file">cache.errors.ts</span>
    │   ├── <span class="file">context.errors.ts</span>
    │   ├── <span class="file">jwt.errors.ts</span>
    │   ├── <span class="file">password.errors.ts</span>
    │   ├── <span class="file">email.errors.ts</span>
    │   ├── <span class="file">error-registry.ts</span>
    │   └── <span class="file">error.types.ts</span>
    ├── <span class="dir">logging/</span>                       <span class="comment"># Logger structure</span>
    │   ├── <span class="file">logger.ts</span>
    │   └── <span class="file">logger.types.ts</span>
    └── <span class="dir">shared/</span>
        ├── <span class="dir">di/</span>
        │   ├── <span class="file">container.ts</span>           <span class="comment"># Injection de dependances</span>
        │   └── <span class="file">tokens.ts</span>              <span class="comment"># Tokens DI</span>
        ├── <span class="dir">types/</span>
        │   ├── <span class="file">result.ts</span>              <span class="comment"># Type Result monadique</span>
        │   └── <span class="file">auth-context.ts</span>
        └── <span class="dir">utils/</span>
            ├── <span class="file">pagination.util.ts</span>
            ├── <span class="file">result-response.util.ts</span>
            └── <span class="file">html-escape.util.ts</span>
      `)}</div>

      <h3>Principes SOLID appliques</h3>
      <div class="arch-grid">
        <div class="arch-card">
          <h4>S — Single Responsibility</h4>
          <p>Chaque use case a une seule responsabilite. <code>create-inscription.use-case.ts</code> ne fait que la reservation.</p>
        </div>
        <div class="arch-card">
          <h4>O — Open/Closed</h4>
          <p>Les repositories sont ouverts a l'extension (nouvelles implementations) sans modifier le domaine.</p>
        </div>
        <div class="arch-card">
          <h4>L — Liskov Substitution</h4>
          <p><code>ArgonPasswordService</code> est substituable a <code>PasswordService</code> sans casser le comportement.</p>
        </div>
        <div class="arch-card">
          <h4>I — Interface Segregation</h4>
          <p>Interfaces specifiques par entite : <code>auth.repository.ts</code>, <code>user.repository.ts</code>, <code>trip.repository.ts</code>, etc.</p>
        </div>
        <div class="arch-card">
          <h4>D — Dependency Inversion</h4>
          <p>Le domaine depend d'abstractions (interfaces), pas de Prisma directement. Injection via <code>container.ts</code> + <code>tokens.ts</code>.</p>
        </div>
      </div>
    </div>
  </section>
);
