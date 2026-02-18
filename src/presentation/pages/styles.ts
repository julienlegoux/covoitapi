export const landingStyles = `
  :root {
    --bg: #0d0d0f;
    --surface: #15151a;
    --surface-2: #1e1e26;
    --surface-3: #25252f;
    --border: #2a2a35;
    --border-glow: #3d3d4d;
    --text: #f0f0f5;
    --text-dim: #7a7a8c;
    --text-muted: #5a5a6b;
    --accent: #00d4aa;
    --accent-2: #7c3aed;
    --accent-3: #f59e0b;
    --accent-glow: rgba(0, 212, 170, 0.15);
    --warn: #fbbf24;
    --danger: #ef4444;
    --danger-glow: rgba(239, 68, 68, 0.15);
    --info: #3b82f6;
    --info-glow: rgba(59, 130, 246, 0.15);
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'DM Sans', sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.7;
    overflow-x: hidden;
    background-image:
      radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0, 212, 170, 0.08), transparent),
      radial-gradient(ellipse 60% 40% at 80% 100%, rgba(124, 58, 237, 0.06), transparent);
  }

  .hero {
    padding: 80px 40px 60px;
    text-align: center;
    position: relative;
    overflow: hidden;
    background:
      radial-gradient(ellipse 100% 100% at 50% 0%, rgba(0, 212, 170, 0.12) 0%, transparent 50%),
      radial-gradient(ellipse 80% 60% at 50% 100%, rgba(124, 58, 237, 0.15) 0%, transparent 50%),
      linear-gradient(180deg, #0a0a0c 0%, var(--bg) 100%);
    border-bottom: 1px solid var(--border);
  }

  .hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      repeating-linear-gradient(90deg, var(--border) 0px, var(--border) 1px, transparent 1px, transparent 80px),
      repeating-linear-gradient(0deg, var(--border) 0px, var(--border) 1px, transparent 1px, transparent 80px);
    opacity: 0.15;
    mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent);
    -webkit-mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent);
  }

  .hero h1 {
    font-family: 'Playfair Display', serif;
    font-size: 3.2rem;
    font-weight: 800;
    background: linear-gradient(135deg, var(--accent) 0%, #fff 50%, var(--accent-2) 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    position: relative;
    margin-bottom: 12px;
    filter: drop-shadow(0 0 40px rgba(0, 212, 170, 0.3));
  }

  .hero .subtitle {
    font-size: 1.1rem;
    color: var(--text-dim);
    position: relative;
    font-weight: 400;
    letter-spacing: 0.02em;
  }

  .hero .badges {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-top: 24px;
    position: relative;
    flex-wrap: wrap;
  }

  .badge {
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 0.5px;
  }

  .badge.hono { background: var(--accent-glow); color: var(--accent); border: 1px solid rgba(0, 212, 170, 0.35); box-shadow: 0 0 20px rgba(0, 212, 170, 0.1); }
  .badge.prisma { background: rgba(124, 58, 237, 0.15); color: #a78bfa; border: 1px solid rgba(124, 58, 237, 0.35); box-shadow: 0 0 20px rgba(124, 58, 237, 0.1); }
  .badge.neon { background: rgba(245, 158, 11, 0.15); color: var(--accent-3); border: 1px solid rgba(245, 158, 11, 0.35); box-shadow: 0 0 20px rgba(245, 158, 11, 0.1); }
  .badge.clean { background: rgba(239, 68, 68, 0.15); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.35); box-shadow: 0 0 20px rgba(239, 68, 68, 0.1); }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 32px;
  }

  nav.toc {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(13, 13, 15, 0.85);
    backdrop-filter: blur(20px) saturate(180%);
    border-bottom: 1px solid var(--border);
    padding: 12px 0;
  }

  nav.toc .container {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    scrollbar-width: none;
  }

  nav.toc a {
    color: var(--text-dim);
    text-decoration: none;
    font-size: 0.82rem;
    font-weight: 500;
    padding: 6px 14px;
    border-radius: 8px;
    white-space: nowrap;
    transition: all 0.25s ease;
    border: 1px solid transparent;
  }

  nav.toc a:hover {
    background: var(--surface-2);
    color: var(--accent);
    border-color: var(--border-glow);
  }

  section {
    padding: 60px 0;
    border-bottom: 1px solid var(--border);
    position: relative;
  }

  section::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 0;
    transform: translateX(-50%);
    width: 1px;
    height: 60px;
    background: linear-gradient(180deg, var(--accent), transparent);
    opacity: 0.5;
  }

  section:last-child { border-bottom: none; }

  h2 {
    font-family: 'Playfair Display', serif;
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 8px;
    color: var(--text);
    letter-spacing: -0.01em;
  }

  h2 .num {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.85rem;
    color: var(--accent);
    display: block;
    margin-bottom: 4px;
    font-weight: 500;
    text-shadow: 0 0 20px rgba(0, 212, 170, 0.4);
  }

  h3 {
    font-size: 1.15rem;
    font-weight: 600;
    color: var(--accent);
    margin: 32px 0 12px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  h3::before {
    content: '';
    width: 4px;
    height: 18px;
    background: linear-gradient(180deg, var(--accent), var(--accent-2));
    border-radius: 2px;
  }

  .section-desc {
    color: var(--text-dim);
    margin-bottom: 32px;
    font-size: 0.95rem;
    max-width: 700px;
  }

  .diagram-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 32px;
    margin: 24px 0;
    overflow-x: auto;
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.3),
      0 2px 4px -2px rgba(0, 0, 0, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.03);
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
  }

  .diagram-card:hover {
    border-color: var(--border-glow);
    box-shadow:
      0 8px 12px -2px rgba(0, 0, 0, 0.4),
      0 4px 8px -4px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }

  .diagram-card .mermaid {
    display: flex;
    justify-content: center;
  }

  .diagram-card .mermaid svg {
    max-width: 100%;
  }

  .entity-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
    margin: 24px 0;
  }

  .entity-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .entity-card:hover {
    border-color: var(--accent);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 212, 170, 0.1), 0 4px 8px rgba(0, 0, 0, 0.3);
  }

  .entity-card .header {
    padding: 14px 20px;
    font-weight: 700;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    gap: 10px;
    border-bottom: 1px solid var(--border);
    background: linear-gradient(90deg, var(--surface-2), var(--surface));
  }

  .entity-card .header .icon {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 600;
  }

  .entity-card .fields {
    padding: 12px 20px;
  }

  .field {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 5px 0;
    font-size: 0.85rem;
    font-family: 'JetBrains Mono', monospace;
  }

  .field .type {
    color: var(--accent);
    min-width: 80px;
    font-size: 0.78rem;
  }

  .field .name { color: var(--text); }

  .field .pk {
    font-size: 0.65rem;
    padding: 2px 6px;
    border-radius: 4px;
    background: rgba(245, 158, 11, 0.2);
    color: var(--accent-3);
    font-weight: 600;
    border: 1px solid rgba(245, 158, 11, 0.3);
  }

  .field .fk {
    font-size: 0.65rem;
    padding: 2px 6px;
    border-radius: 4px;
    background: rgba(59, 130, 246, 0.2);
    color: var(--info);
    font-weight: 600;
    border: 1px solid rgba(59, 130, 246, 0.3);
  }

  .routes-table {
    width: 100%;
    border-collapse: collapse;
    margin: 24px 0;
    font-size: 0.88rem;
  }

  .routes-table th {
    text-align: left;
    padding: 12px 16px;
    font-weight: 600;
    color: var(--text-dim);
    border-bottom: 2px solid var(--border);
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .routes-table td {
    padding: 10px 16px;
    border-bottom: 1px solid var(--border);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.82rem;
  }

  .routes-table tr:hover td {
    background: var(--accent-glow);
  }

  .method {
    padding: 3px 10px;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.72rem;
    letter-spacing: 0.5px;
  }

  .method.get { background: rgba(245, 158, 11, 0.15); color: var(--accent-3); border: 1px solid rgba(245, 158, 11, 0.25); }
  .method.post { background: rgba(0, 212, 170, 0.15); color: var(--accent); border: 1px solid rgba(0, 212, 170, 0.25); }
  .method.put { background: rgba(124, 58, 237, 0.15); color: #a78bfa; border: 1px solid rgba(124, 58, 237, 0.25); }
  .method.patch { background: rgba(59, 130, 246, 0.15); color: var(--info); border: 1px solid rgba(59, 130, 246, 0.25); }
  .method.delete { background: rgba(239, 68, 68, 0.15); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.25); }

  .arch-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 16px;
    margin: 24px 0;
  }

  .arch-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 24px;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .arch-card:hover {
    border-color: var(--border-glow);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  }

  .arch-card h4 {
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .arch-card p {
    font-size: 0.83rem;
    color: var(--text-dim);
    line-height: 1.6;
  }

  .arch-card code {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.78rem;
    background: var(--surface-3);
    padding: 2px 6px;
    border-radius: 4px;
    color: var(--accent);
    border: 1px solid var(--border);
  }

  .folder-tree {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.82rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 24px;
    line-height: 1.9;
    color: var(--text-dim);
    overflow-x: auto;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .folder-tree .dir { color: var(--accent); font-weight: 500; }
  .folder-tree .file { color: var(--text); }
  .folder-tree .comment { color: var(--text-muted); }
`;
