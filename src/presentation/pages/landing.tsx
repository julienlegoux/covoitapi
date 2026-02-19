import type { Context } from 'hono';
import { raw } from 'hono/html';
import { landingStyles } from './styles.js';
import { Hero } from './sections/hero.js';
import { Nav } from './sections/nav.js';
import { EntitiesSection } from './sections/entities.js';
import { UseCasesSection } from './sections/use-cases.js';
import { ClassDiagramSection } from './sections/class-diagram.js';
import { SequencesSection } from './sections/sequences.js';
import { McdSection } from './sections/mcd.js';
import { RoutesSection } from './sections/routes-table.js';
import { ArchitectureSection } from './sections/architecture.js';

export const landingHandler = (c: Context) => c.html(<LandingPage />);

const LandingPage = () => (
  <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Analyse UML — API REST Covoiturage</title>
      {raw(`<script src="https://cdnjs.cloudflare.com/ajax/libs/mermaid/10.9.0/mermaid.min.js"></script>`)}
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:wght@700;800&display=swap" rel="stylesheet" />
      <style>{raw(landingStyles)}</style>
    </head>
    <body>
      <Hero />
      <Nav />
      <EntitiesSection />
      <UseCasesSection />
      <ClassDiagramSection />
      <SequencesSection />
      <McdSection />
      <RoutesSection />
      <ArchitectureSection />

      <div style="padding:40px;text-align:center;color:var(--text-dim);font-size:0.82rem;">
        Analyse UML — API REST Covoiturage • Hono + Prisma + Neon PostgreSQL • Clean Architecture + SOLID + RGPD
      </div>

      {raw(`<script>
mermaid.initialize({
  startOnLoad: true,
  theme: 'dark',
  themeVariables: {
    darkMode: true,
    background: '#15151a',
    primaryColor: '#00d4aa',
    primaryTextColor: '#f0f0f5',
    primaryBorderColor: '#2a2a35',
    lineColor: '#7a7a8c',
    secondaryColor: '#1e1e26',
    tertiaryColor: '#25252f',
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '14px'
  },
  flowchart: { curve: 'basis', padding: 20 },
  sequence: { mirrorActors: false, messageAlign: 'center' }
});
</script>`)}
    </body>
  </html>
);
