const EntityCard = ({ icon, iconStyle, title, fields }: {
  icon: string;
  iconStyle: string;
  title: string;
  fields: { type: string; name: string; badge?: 'pk' | 'fk' | 'pk-fk' }[];
}) => (
  <div class="entity-card">
    <div class="header">
      <div class="icon" style={iconStyle}>{icon}</div>
      {title}
    </div>
    <div class="fields">
      {fields.map((f) => (
        <div class="field">
          <span class="type">{f.type}</span>
          <span class="name">{f.name}</span>
          {f.badge === 'pk' && <span class="pk">PK</span>}
          {f.badge === 'fk' && <span class="fk">FK</span>}
          {f.badge === 'pk-fk' && <><span class="pk">PK</span><span class="fk">FK</span></>}
        </div>
      ))}
    </div>
  </div>
);

export const EntitiesSection = () => (
  <section id="entities">
    <div class="container">
      <h2><span class="num">01</span>Entités du Domaine</h2>
      <p class="section-desc">Les entités métier extraites du cahier des charges, avec leurs attributs et relations.</p>

      <div class="entity-grid">
        <EntityCard
          icon="A"
          iconStyle="background:rgba(108,140,255,0.15);color:var(--accent);"
          title="Auth (Authentification)"
          fields={[
            { type: 'UUID', name: 'id', badge: 'pk' },
            { type: 'Int', name: 'refId' },
            { type: 'String', name: 'email' },
            { type: 'String', name: 'password' },
            { type: 'Role', name: 'role' },
            { type: 'DateTime?', name: 'anonymizedAt' },
            { type: 'DateTime', name: 'createdAt' },
            { type: 'DateTime', name: 'updatedAt' },
          ]}
        />

        <EntityCard
          icon="U"
          iconStyle="background:rgba(52,211,153,0.15);color:var(--accent);"
          title="User (Utilisateur)"
          fields={[
            { type: 'UUID', name: 'id', badge: 'pk' },
            { type: 'Int', name: 'refId' },
            { type: 'String?', name: 'firstName' },
            { type: 'String?', name: 'lastName' },
            { type: 'String?', name: 'phone' },
            { type: 'Int', name: 'authRefId', badge: 'fk' },
            { type: 'DateTime?', name: 'anonymizedAt' },
            { type: 'DateTime', name: 'createdAt' },
            { type: 'DateTime', name: 'updatedAt' },
          ]}
        />

        <EntityCard
          icon="D"
          iconStyle="background:rgba(167,139,250,0.15);color:var(--accent-2);"
          title="Driver (Conducteur)"
          fields={[
            { type: 'UUID', name: 'id', badge: 'pk' },
            { type: 'Int', name: 'refId' },
            { type: 'String', name: 'driverLicense' },
            { type: 'Int', name: 'userRefId', badge: 'fk' },
            { type: 'DateTime?', name: 'anonymizedAt' },
          ]}
        />

        <EntityCard
          icon="T"
          iconStyle="background:rgba(52,211,153,0.15);color:var(--accent-3);"
          title="Travel (Trajet)"
          fields={[
            { type: 'UUID', name: 'id', badge: 'pk' },
            { type: 'Int', name: 'refId' },
            { type: 'DateTime', name: 'dateRoute' },
            { type: 'Int', name: 'kms' },
            { type: 'Int', name: 'seats' },
            { type: 'Int', name: 'driverRefId', badge: 'fk' },
            { type: 'Int', name: 'carRefId', badge: 'fk' },
          ]}
        />

        <EntityCard
          icon="I"
          iconStyle="background:rgba(244,114,182,0.15);color:var(--danger);"
          title="Inscription (Reservation)"
          fields={[
            { type: 'UUID', name: 'id', badge: 'pk' },
            { type: 'Int', name: 'refId' },
            { type: 'Int', name: 'userRefId', badge: 'fk' },
            { type: 'Int', name: 'routeRefId', badge: 'fk' },
            { type: 'Status', name: 'status' },
            { type: 'DateTime', name: 'createdAt' },
          ]}
        />

        <EntityCard
          icon="V"
          iconStyle="background:rgba(248,113,113,0.15);color:var(--danger);"
          title="City (Ville)"
          fields={[
            { type: 'UUID', name: 'id', badge: 'pk' },
            { type: 'Int', name: 'refId' },
            { type: 'String', name: 'cityName' },
            { type: 'String', name: 'zipcode' },
          ]}
        />

        <EntityCard
          icon="CT"
          iconStyle="background:rgba(59,130,246,0.15);color:var(--info);"
          title="CityTravel (Ville-Trajet)"
          fields={[
            { type: 'Int', name: 'routeRefId', badge: 'pk-fk' },
            { type: 'Int', name: 'cityRefId', badge: 'pk-fk' },
            { type: 'Enum', name: 'type' },
          ]}
        />

        <EntityCard
          icon="C"
          iconStyle="background:rgba(251,191,36,0.15);color:var(--warn);"
          title="Car (Voiture)"
          fields={[
            { type: 'UUID', name: 'id', badge: 'pk' },
            { type: 'Int', name: 'refId' },
            { type: 'String', name: 'immat' },
            { type: 'Int', name: 'modelRefId', badge: 'fk' },
          ]}
        />

        <EntityCard
          icon="M"
          iconStyle="background:rgba(245,158,11,0.15);color:var(--accent-3);"
          title="Model (Modele)"
          fields={[
            { type: 'UUID', name: 'id', badge: 'pk' },
            { type: 'Int', name: 'refId' },
            { type: 'String', name: 'name' },
            { type: 'Int', name: 'brandRefId', badge: 'fk' },
          ]}
        />

        <EntityCard
          icon="B"
          iconStyle="background:rgba(167,139,250,0.15);color:var(--accent-2);"
          title="Brand (Marque)"
          fields={[
            { type: 'UUID', name: 'id', badge: 'pk' },
            { type: 'Int', name: 'refId' },
            { type: 'String', name: 'name' },
          ]}
        />

        <EntityCard
          icon="Co"
          iconStyle="background:rgba(0,212,170,0.15);color:var(--accent);"
          title="Color (Couleur)"
          fields={[
            { type: 'UUID', name: 'id', badge: 'pk' },
            { type: 'Int', name: 'refId' },
            { type: 'String', name: 'name' },
            { type: 'String', name: 'hex' },
          ]}
        />
      </div>
    </div>
  </section>
);
