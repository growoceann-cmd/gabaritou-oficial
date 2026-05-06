/**
 * Gerador de HTML para o Ecossistema Gabaritou.
 * Cria arquivos HTML com branding oficial para envio via Bot.
 */

export function generateReportHTML(data) {
  const { title, name, date, stats, weakPoints, strongPoints, recommendations } = data;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>GABARITOU — ${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
:root {
  --abyss: #020205;
  --nebula: #050510;
  --violet: #8b5cf6;
  --cyan: #22d3ee;
  --gold: #fbbf24;
  --text: #e2e8f0;
  --text-dim: #94a3b8;
  --success: #10b981;
  --danger: #ef4444;
}

body {
  font-family: 'Outfit', sans-serif;
  background-color: var(--abyss);
  color: var(--text);
  margin: 0;
  padding: 0;
}

.container {
  max-width: 800px;
  margin: 40px auto;
  background: var(--nebula);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 0 50px rgba(0,0,0,0.5);
}

header {
  text-align: center;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  padding-bottom: 30px;
  margin-bottom: 40px;
}

.logo {
  font-size: 2.5rem;
  font-weight: 800;
  background: linear-gradient(90deg, var(--cyan), var(--violet));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 10px;
}

.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(34, 211, 238, 0.1);
  border: 1px solid var(--cyan);
  color: var(--cyan);
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 2px;
}

h2 { color: var(--violet); font-size: 1.5rem; margin-top: 40px; border-left: 4px solid var(--violet); padding-left: 15px; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  margin: 30px 0;
}

.stat-card {
  background: rgba(255,255,255,0.03);
  padding: 20px;
  border-radius: 16px;
  text-align: center;
  border: 1px solid rgba(255,255,255,0.05);
}

.stat-value { font-size: 2rem; font-weight: 800; color: var(--cyan); display: block; }
.stat-label { font-size: 0.7rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px; }

.point-list { list-style: none; padding: 0; }
.point-list li { margin-bottom: 12px; padding: 15px; background: rgba(255,255,255,0.02); border-radius: 10px; display: flex; align-items: center; gap: 15px; }
.point-list.weak li { border-left: 4px solid var(--danger); }
.point-list.strong li { border-left: 4px solid var(--success); }

.recommendation-box {
  background: rgba(139, 92, 246, 0.05);
  border: 1px solid rgba(139, 92, 246, 0.2);
  padding: 25px;
  border-radius: 16px;
  margin-top: 30px;
  font-style: italic;
}

footer {
  margin-top: 60px;
  text-align: center;
  color: var(--text-dim);
  font-size: 0.8rem;
}
</style>
</head>
<body>
<div class="container">
  <header>
    <div class="logo">GABARITOU</div>
    <div class="badge">${title}</div>
    <p style="margin-top: 15px;">Estudante: <strong>${name}</strong> | Data: ${date}</p>
  </header>

  <div class="stats-grid">
    ${stats.map(s => `
      <div class="stat-card">
        <span class="stat-value">${s.value}</span>
        <span class="stat-label">${s.label}</span>
      </div>
    `).join('')}
  </div>

  <h2>📚 Pontos Fracos (Precisam de Atenção)</h2>
  <ul class="point-list weak">
    ${weakPoints.map(p => `<li><span>⚠️</span> <div><strong>${p.topic}:</strong> ${p.status}</div></li>`).join('')}
  </ul>

  <h2>✅ Pontos Fortes (Dominados)</h2>
  <ul class="point-list strong">
    ${strongPoints.map(p => `<li><span>🛡️</span> <div><strong>${p.topic}:</strong> ${p.status}</div></li>`).join('')}
  </ul>

  <div class="recommendation-box">
    <strong>🎯 Recomendação Sniper:</strong><br><br>
    ${recommendations}
  </div>

  <footer>
    <p>GABARITOU — Ecossistema de Inteligência Preditiva v3.2</p>
    <p>© 2026 Operação Aegis</p>
  </footer>
</div>
</body>
</html>`;
}
