const RouteGroup = ({ title }: { title: string }) => (
  <tr>
    <td colSpan={5} style="color:var(--accent);font-weight:600;padding-top:16px;border:none;">{title}</td>
  </tr>
);

const Route = ({ method, path, auth, params, desc }: {
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  path: string;
  auth: string;
  params: string;
  desc: string;
}) => (
  <tr>
    <td><span class={`method ${method}`}>{method.toUpperCase()}</span></td>
    <td>{path}</td>
    <td>{auth}</td>
    <td>{params}</td>
    <td>{desc}</td>
  </tr>
);

export const RoutesSection = () => (
  <section id="routes">
    <div class="container">
      <h2><span class="num">06</span>Routes de l'API REST</h2>
      <p class="section-desc">Ensemble des endpoints de l'API REST, organises par ressource avec controle d'acces par role (USER / DRIVER / ADMIN).</p>

      <div class="diagram-card" style="padding:16px;">
        <table class="routes-table">
          <thead>
            <tr><th>Methode</th><th>Route</th><th>Auth</th><th>Parametres</th><th>Description</th></tr>
          </thead>
          <tbody>
            <RouteGroup title="Authentification" />
            <Route method="post" path="/api/auth/register" auth="Public" params="email, password, confirmPassword" desc="Inscription utilisateur" />
            <Route method="post" path="/api/auth/login" auth="Public" params="email, password" desc="Authentification → JWT token" />

            <RouteGroup title="Utilisateurs" />
            <Route method="get" path="/api/users" auth="ADMIN" params="?page, ?limit" desc="Liste de tous les utilisateurs" />
            <Route method="get" path="/api/users/:id" auth="USER" params="id (UUID)" desc="Detail d'un utilisateur" />
            <Route method="patch" path="/api/users/me" auth="USER" params="?firstName, ?lastName, ?phone" desc="Modifier mon profil" />
            <Route method="delete" path="/api/users/me" auth="USER" params="—" desc="Anonymiser mon compte (RGPD)" />
            <Route method="delete" path="/api/users/:id" auth="ADMIN" params="id (UUID)" desc="Anonymiser un utilisateur" />

            <RouteGroup title="Conducteurs" />
            <Route method="post" path="/api/drivers" auth="USER" params="driverLicense" desc="Devenir conducteur" />

            <RouteGroup title="Trajets" />
            <Route method="get" path="/api/travels" auth="USER" params="?page, ?limit" desc="Liste des trajets (pagine)" />
            <Route method="get" path="/api/travels/search" auth="USER" params="?departureCity, ?arrivalCity, ?date" desc="Rechercher un trajet" />
            <Route method="get" path="/api/travels/:id" auth="USER" params="id (UUID)" desc="Detail d'un trajet" />
            <Route method="post" path="/api/travels" auth="DRIVER" params="kms, date, departureCity, arrivalCity, seats, carId" desc="Publier un trajet" />
            <Route method="delete" path="/api/travels/:id" auth="DRIVER" params="id (UUID)" desc="Supprimer un trajet" />

            <RouteGroup title="Inscriptions (Reservations)" />
            <Route method="get" path="/api/inscriptions" auth="USER" params="?page, ?limit" desc="Liste des reservations" />
            <Route method="post" path="/api/inscriptions" auth="USER" params="travelId" desc="Reserver une place" />
            <Route method="delete" path="/api/inscriptions/:id" auth="USER" params="id (UUID)" desc="Annuler une reservation" />

            <RouteGroup title="Routes imbriquees" />
            <Route method="get" path="/api/users/:id/inscriptions" auth="USER" params="id (UUID), ?page, ?limit" desc="Reservations d'un utilisateur" />
            <Route method="get" path="/api/travels/:id/passengers" auth="USER" params="id (UUID), ?page, ?limit" desc="Passagers d'un trajet" />

            <RouteGroup title="Marques" />
            <Route method="get" path="/api/brands" auth="DRIVER" params="?page, ?limit" desc="Liste des marques" />
            <Route method="post" path="/api/brands" auth="ADMIN" params="name" desc="Ajouter une marque" />
            <Route method="delete" path="/api/brands/:id" auth="ADMIN" params="id (UUID)" desc="Supprimer une marque" />

            <RouteGroup title="Voitures" />
            <Route method="get" path="/api/cars" auth="DRIVER" params="?page, ?limit" desc="Liste des voitures" />
            <Route method="post" path="/api/cars" auth="DRIVER" params="model, brandId, licensePlate" desc="Ajouter une voiture" />
            <Route method="put" path="/api/cars/:id" auth="DRIVER" params="model, brandId, licensePlate" desc="Modifier voiture (complet)" />
            <Route method="patch" path="/api/cars/:id" auth="DRIVER" params="?model, ?brandId, ?licensePlate" desc="Modifier voiture (partiel)" />
            <Route method="delete" path="/api/cars/:id" auth="DRIVER" params="id (UUID)" desc="Supprimer une voiture" />

            <RouteGroup title="Villes" />
            <Route method="get" path="/api/cities" auth="USER" params="?page, ?limit" desc="Liste des villes" />
            <Route method="post" path="/api/cities" auth="USER" params="cityName, zipcode" desc="Ajouter une ville" />
            <Route method="delete" path="/api/cities/:id" auth="ADMIN" params="id (UUID)" desc="Supprimer une ville" />

            <RouteGroup title="Couleurs" />
            <Route method="get" path="/api/colors" auth="DRIVER" params="?page, ?limit" desc="Liste des couleurs" />
            <Route method="post" path="/api/colors" auth="DRIVER" params="name, hex" desc="Ajouter une couleur" />
            <Route method="patch" path="/api/colors/:id" auth="DRIVER" params="?name, ?hex" desc="Modifier une couleur" />
            <Route method="delete" path="/api/colors/:id" auth="DRIVER" params="id (UUID)" desc="Supprimer une couleur" />

            <RouteGroup title="Systeme" />
            <Route method="get" path="/api/health" auth="Public" params="—" desc="Health check" />
          </tbody>
        </table>
      </div>
    </div>
  </section>
);
