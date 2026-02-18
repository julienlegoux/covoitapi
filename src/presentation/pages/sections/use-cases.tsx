import { raw } from 'hono/html';

const MermaidDiagram = ({ chart }: { chart: string }) => (
  <div class="diagram-card">
    <div class="mermaid">{raw(chart)}</div>
  </div>
);

export const UseCasesSection = () => (
  <section id="usecase">
    <div class="container">
      <h2><span class="num">02</span>Diagrammes de Cas d'Utilisation</h2>
      <p class="section-desc">Les cas d'utilisation identifiés pour les trois acteurs : Utilisateur, Conducteur et Administrateur.</p>

      <h3>Use Case — Authentification &amp; Inscription</h3>
      <MermaidDiagram chart={`
graph LR
    User((Utilisateur))
    Admin((Admin))

    UC1[Authentification]
    UC2[Inscription]
    UC3[Confirmation Registration]

    User --> UC1
    User --> UC2
    Admin --> UC1
    UC1 -.extend.-> UC2
    UC2 -.include.-> UC3
      `} />

      <h3>Use Case — Accueil (Utilisateur Authentifie)</h3>
      <MermaidDiagram chart={`
graph LR
    User((Utilisateur))
    Driver((Conducteur))

    UC0[Authentification]
    UC1[Accueil]
    UC2[Liste des Trajets]
    UC3[Rechercher un Trajet]
    UC4[Reserver une Place]
    UC5[Mon Compte]
    UC6[Devenir Conducteur]
    UC7[Publier un Trajet]
    UC8[Gerer mes Voitures]

    User --> UC1
    Driver --> UC7
    Driver --> UC8
    UC1 -.include.-> UC0
    UC1 -.include.-> UC2
    UC1 -.extend.-> UC3
    UC1 -.extend.-> UC4
    UC1 -.extend.-> UC5
    UC1 -.extend.-> UC6
      `} />

      <h3>Use Case — Detail &amp; Reservation d'un Trajet</h3>
      <MermaidDiagram chart={`
graph LR
    User((Utilisateur))

    UC1[Liste des Trajets]
    UC2[Detail d un Trajet]
    UC3[Reserver une Place]
    UC4[Annuler une Reservation]

    User --> UC1
    UC1 -.extend.-> UC2
    UC2 -.extend.-> UC3
    UC2 -.extend.-> UC4
      `} />

      <h3>Use Case — Gestion des Trajets (Conducteur)</h3>
      <MermaidDiagram chart={`
graph LR
    Driver((Conducteur))

    UC1[Mes Trajets]
    UC2[Voir les Passagers]
    UC3[Publier un Trajet]
    UC4[Creer un Trajet]
    UC5[Supprimer un Trajet]
    UC6[Gerer mes Voitures]
    UC7[Ajouter une Voiture]
    UC8[Modifier une Voiture]
    UC9[Supprimer une Voiture]

    Driver --> UC1
    Driver --> UC3
    Driver --> UC6
    UC1 -.extend.-> UC2
    UC3 -.extend.-> UC4
    UC3 -.extend.-> UC5
    UC6 -.extend.-> UC7
    UC6 -.extend.-> UC8
    UC6 -.extend.-> UC9
      `} />

      <h3>Use Case — Mon Compte &amp; RGPD</h3>
      <MermaidDiagram chart={`
graph LR
    User((Utilisateur))

    UC1[Informations de mon compte]
    UC2[Modifier mon profil]
    UC3[Anonymiser mon compte RGPD]

    User --> UC1
    UC1 -.extend.-> UC2
    UC1 -.extend.-> UC3
      `} />

      <h3>Use Case — Administration</h3>
      <MermaidDiagram chart={`
graph LR
    Admin((Admin))

    UC1[Liste des Utilisateurs]
    UC2[Supprimer un Utilisateur]
    UC3[Gerer les Marques]
    UC4[Gerer les Villes]
    UC5[Ajouter une Marque]
    UC6[Supprimer une Marque]
    UC7[Ajouter une Ville]
    UC8[Supprimer une Ville]

    Admin --> UC1
    Admin --> UC3
    Admin --> UC4
    UC1 -.extend.-> UC2
    UC3 -.extend.-> UC5
    UC3 -.extend.-> UC6
    UC4 -.extend.-> UC7
    UC4 -.extend.-> UC8
      `} />
    </div>
  </section>
);
