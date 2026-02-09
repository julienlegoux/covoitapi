# Rapport de conformite — Specification vs Implementation

> Comparaison entre le cahier des charges "Application Mobile de Covoiturage v5.1" et l'etat actuel de l'API.

---

## 1. Vue d'ensemble

| Domaine | Statut |
|---|---|
| Authentification (login/register) | Conforme |
| Gestion des trajets (CRUD) | Partiellement conforme |
| Reservations (inscriptions) | Partiellement conforme |
| Recherche de trajets | Conforme |
| Gestion du profil utilisateur | Partiellement conforme |
| Gestion des voitures | Partiellement conforme |
| Notifications email (Brevo) | Non conforme |
| Admin (activation/desactivation) | Non implemente |
| CI/CD & Deploiement | Non implemente |
| SonarQube | Non implemente |
| Tests d'integration | Non implemente |

---

## 2. Ce qui est CONFORME

### 2.1 Authentification
- **POST /api/auth/register** — inscription avec email, password, confirmPassword
- **POST /api/auth/login** — connexion avec email, password, retour d'un token JWT
- **Token dans le header `x-auth-token`** — conforme a la spec
- **Validation du mot de passe** — confirmation password, min 8 caracteres, regex (majuscule, minuscule, chiffre)
- **Roles** — USER, DRIVER, ADMIN sont bien definis

### 2.2 Trajets (CRUD)
- **GET /api/travels/** — liste de tous les trajets
- **GET /api/travels/:id** — detail d'un trajet
- **GET /api/travels/search** — recherche par ville depart, ville arrivee, date
- **POST /api/travels/** — creation d'un trajet (role DRIVER requis)
- **DELETE /api/travels/:id** — suppression d'un trajet (role DRIVER requis)
- **Champs conformes** : kms, date, ville de depart, ville d'arrivee, nombre de places

### 2.3 Reservations
- **POST /api/inscriptions/** — reserver une place
- **DELETE /api/inscriptions/:id** — annuler une reservation
- **GET /api/inscriptions/** — lister les reservations
- **GET /api/users/:id/inscriptions** — reservations d'un utilisateur
- **GET /api/travels/:id/passengers** — passagers d'un trajet
- **Controle du nombre de places** — verifie que seats > inscriptions avant reservation
- **Controle de doublon** — empeche une double inscription sur le meme trajet
- **Suppression en cascade** — suppression d'un trajet supprime toutes les inscriptions (via `onDelete: Cascade` en DB)

### 2.4 Marques
- **GET /api/brands/** — liste des marques
- **POST /api/brands/** — creation (ADMIN)
- **DELETE /api/brands/:id** — suppression (ADMIN)

### 2.5 Villes
- **GET /api/cities/** — liste des villes
- **POST /api/cities/** — creation
- **DELETE /api/cities/:id** — suppression (ADMIN)

### 2.6 Voitures (CRUD de base)
- **POST /api/cars/** — creation
- **PUT /api/cars/:id** — mise a jour complete
- **PATCH /api/cars/:id** — mise a jour partielle
- **DELETE /api/cars/:id** — suppression
- **GET /api/cars/** — liste

### 2.7 RGPD
- **DELETE /api/users/me** — auto-suppression/anonymisation des donnees utilisateur

---

## 3. Ce qui est PARTIELLEMENT CONFORME

### 3.1 Detail du trajet — Passagers manquants dans la reponse
**Spec** : Le detail du trajet doit inclure les noms et prenoms des passagers.
**Actuel** : `GET /api/travels/:id` retourne uniquement les donnees du trajet (kms, date, seats, driver, car). Les passagers sont disponibles via un endpoint separe (`GET /api/travels/:id/passengers`), mais ne sont pas inclus dans la reponse du detail.

### 3.2 Profil utilisateur — Champ `address` manquant
**Spec** : L'utilisateur peut modifier son adresse, telephone, nom et prenom.
**Actuel** : Le modele User contient `firstName`, `lastName`, `phone` mais **pas de champ `address`**. La route `PATCH /api/users/me` ne permet donc pas de modifier une adresse.

### 3.3 Voiture — Pas de champ `seats` (nombre de places)
**Spec** : La voiture a un champ "nombre de places".
**Actuel** : Le nombre de places (`seats`) est sur le modele **Travel**, pas sur **Car**. Le modele Car n'a que : `id`, `refId`, `immat`, `modelRefId`. Cela signifie que le nombre de places est defini par trajet, pas par voiture.

### 3.4 Voiture — Pas de lien voiture-utilisateur
**Spec** : 1 vehicule maximum par utilisateur. La voiture est liee au profil.
**Actuel** : Aucune relation directe entre Car et User/Driver. La voiture est liee au Travel. Un conducteur peut potentiellement utiliser plusieurs voitures differentes, et aucune contrainte n'empeche d'avoir plus d'un vehicule.

### 3.5 Service email — Resend au lieu de Brevo
**Spec** : Utiliser l'API Brevo pour les emails.
**Actuel** : L'implementation utilise **Resend** (`ResendEmailService`). Seul un email de bienvenue est implemente.

### 3.6 Nommage des routes
| Spec | Implementation | Statut |
|---|---|---|
| `/persons` | `/users` | Different |
| `/trips` | `/travels` | Different |
| `/registrations` | `/inscriptions` | Different |
| `/postcodes` | Non implemente | Manquant |
| `/drivers` (GET) | Non implemente | Manquant |

> Le nommage est coherent dans l'implementation mais differe de la spec. A evaluer si c'est un choix delibere ou un ecart a corriger.

---

## 4. Ce qui est MANQUANT

### 4.1 Notifications email
La spec exige 3 types de notifications automatiques, **aucune n'est implementee** :

| Notification | Declencheur | Statut |
|---|---|---|
| Email au conducteur quand un passager reserve | POST inscription | Non implemente |
| Email a tous les passagers quand le conducteur annule le trajet | DELETE trajet | Non implemente |
| Email au conducteur quand un passager annule | DELETE inscription | Non implemente |

Le contenu attendu de l'email au conducteur lors d'une reservation :
> Nom, prenom, telephone, email du passager

### 4.2 Admin — Activation/Desactivation de comptes
**Spec** : L'administrateur peut activer ou desactiver des comptes utilisateurs.
**Actuel** : Aucune fonctionnalite d'activation/desactivation. Pas de champ `isActive` ou equivalent sur le modele Auth/User. L'admin peut uniquement lister, consulter et supprimer (anonymiser) des utilisateurs.

### 4.3 Verification du profil complet
**Spec** : Avant de reserver ou creer un trajet, verifier que le profil utilisateur est complet.
**Actuel** : Aucune verification de completude du profil dans les use cases `CreateInscription` ou `CreateTravel`.

### 4.4 GET /cars/:id — Detail d'une voiture
**Spec** : Route `GET car` pour obtenir le detail d'une seule voiture.
**Actuel** : Seule la liste (`GET /api/cars/`) est implementee. Pas de route pour un detail individuel.

### 4.5 GET /postcodes — Liste des codes postaux
**Spec** : Route pour lister les codes postaux.
**Actuel** : Non implemente. Le modele City a un champ `zipcode` mais aucune route dediee.

### 4.6 GET /drivers — Liste des conducteurs
**Spec** : Route pour lister les conducteurs.
**Actuel** : Seule la creation d'un conducteur (`POST /api/drivers/`) est implementee.

### 4.7 POST /persons — Creation d'un utilisateur standalone
**Spec** : Route pour creer un utilisateur independamment de l'inscription.
**Actuel** : Un utilisateur est cree uniquement lors de l'inscription (`register`). Pas de creation standalone.

### 4.8 CI/CD
**Spec** : Automatiser les tests dans GitLab ou GitHub. Deploiement automatique apres reussite des tests.
**Actuel** : Aucun fichier `.github/workflows/` ni `.gitlab-ci.yml` trouve.

### 4.9 SonarQube
**Spec** : Generer un rapport de qualite de code via SonarQube.
**Actuel** : Aucun fichier `sonar-project.properties` ou configuration SonarQube trouvee.

### 4.10 Tests d'integration
**Spec** : Mettre en place des tests d'integration pour tester les routes.
**Actuel** : Des tests unitaires existent (Vitest) pour les use cases, controllers, et validators. Cependant, il n'y a **pas de tests d'integration** testant les routes HTTP de bout en bout.

### 4.11 Dockerfile / Deploiement
**Spec** : Deploiement sur espace web.
**Actuel** : Aucun Dockerfile, docker-compose, ni configuration de deploiement trouvee.

---

## 5. EXTRAS — Ce qui existe mais n'est pas dans la spec

| Feature | Description |
|---|---|
| **Colors** (CRUD complet) | Routes GET/POST/PATCH/DELETE pour les couleurs de voitures — non mentionne dans la spec |
| **ColorModel** (table pivot) | Relation many-to-many entre couleurs et modeles de voiture |
| **Models** (table separee) | Les modeles de voiture ont leur propre table avec relation a Brand — la spec semble plus simple (champ texte) |
| **Driver license** | Le modele Driver exige un `driverLicense` — non mentionne dans la spec |
| **Email de bienvenue** | Un email de bienvenue est envoye a l'inscription — non demande dans la spec |
| **Anonymisation RGPD** | Implementation sophistiquee avec anonymisation plutot que suppression — la spec demande suppression en cascade |
| **Pagination** | Systeme de pagination integre — non mentionne dans la spec mais bonne pratique |
| **Health check** | Route `GET /api/health` — non demande mais utile |

---

## 6. Resume des priorites

### Critique (fonctionnalites coeur manquantes)
1. Implementer les notifications email (Brevo ou Resend selon le choix)
2. Ajouter le champ `address` au profil utilisateur
3. Ajouter la verification de completude du profil avant reservation/creation de trajet
4. Ajouter la fonctionnalite d'activation/desactivation des comptes (admin)

### Important (conformite routes)
5. Ajouter `GET /cars/:id`
6. Ajouter `GET /drivers` (liste des conducteurs)
7. Ajouter `GET /postcodes`
8. Lier la voiture au conducteur (relation Car-Driver, 1 voiture max par utilisateur)
9. Inclure les passagers dans le detail d'un trajet

### Souhaitable (infra & qualite)
10. Mettre en place CI/CD (GitHub Actions)
11. Configurer SonarQube
12. Ajouter des tests d'integration
13. Creer un Dockerfile pour le deploiement

---

*Rapport genere le 2026-02-09*
