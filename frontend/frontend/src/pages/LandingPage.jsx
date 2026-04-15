import React from 'react'

export default function LandingPage() {
  return (
    <div className="landing-container" style={{ backgroundColor: '#0a0a0c', color: '#f4f4f5', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      {/* Hero Section */}
      <header style={{ padding: '80px 20px', textAlign: 'center', background: 'radial-gradient(circle at top, #1e1b4b 0%, #0a0a0c 100%)' }}>
        <div style={{ fontSize: '14px', fontWeight: 800, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '20px' }}>
          A 1ª IA Preditiva para Concursos do Mundo
        </div>
        <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '30px' }}>
          Pare de Estudar no Escuro. <br/>
          <span style={{ background: 'linear-gradient(135deg, #22d3ee, #8b5cf6)', WebkitBackgroundClip: text, WebkitTextFillColor: 'transparent' }}>
            Gabarite o Futuro.
          </span>
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#a1a1aa', maxWidth: '700px', margin: '0 auto 40px', lineHeight: 1.6 }}>
          Nossa IA analisou 15.000+ provas para prever o que vai cair no seu concurso com 87% de precisão. 
          Estratégia de elite por preço de custo.
        </p>
        
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="https://t.me/gabaritou_oficial_bot?start=GABARITOU2026" className="btn btn-lg btn-primary" style={{ padding: '20px 40px', fontSize: '18px', borderRadius: '50px', fontWeight: 800 }}>
            🚀 ACESSAR BETA (50 VAGAS)
          </a>
          <button className="btn btn-lg btn-outline" style={{ padding: '20px 40px', fontSize: '18px', borderRadius: '50px', fontWeight: 800 }}>
            VER PREDIÇÕES HOJE
          </button>
        </div>
      </header>

      {/* Micro-Services Section */}
      <section style={{ padding: '100px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '60px', fontWeight: 800 }}>Tecnologia Shark para sua Posse</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
          {/* Radar */}
          <div className="card-glow" style={{ padding: '40px', borderRadius: '30px', border: '1px solid #27272a', background: '#141417' }}>
            <div style={{ fontSize: '40px', marginBottom: '20px' }}>📡</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Radar Elite</h3>
            <p style={{ color: '#a1a1aa', marginBottom: '25px' }}>Atualidades e novos editais em tempo real. O algoritmo que te avisa antes de todo mundo.</p>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#22d3ee' }}>R$ 3,00<small style={{ fontSize: '12px', color: '#71717a' }}> /mês</small></div>
          </div>

          {/* GPS */}
          <div className="card-glow" style={{ padding: '40px', borderRadius: '30px', border: '1px solid #27272a', background: '#141417' }}>
            <div style={{ fontSize: '40px', marginBottom: '20px' }}>🛰️</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>GPS de Aprovação</h3>
            <p style={{ color: '#a1a1aa', marginBottom: '25px' }}>Auditoria completa de edital. Saiba exatamente quais temas você está negligenciando.</p>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#22d3ee' }}>R$ 2,00<small style={{ fontSize: '12px', color: '#71717a' }}> /único</small></div>
          </div>

          {/* Mapa Mental */}
          <div className="card-glow" style={{ padding: '40px', borderRadius: '30px', border: '1px solid #27272a', background: '#141417' }}>
            <div style={{ fontSize: '40px', marginBottom: '20px' }}>🧠</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Mapa Mental IA</h3>
            <p style={{ color: '#a1a1aa', marginBottom: '25px' }}>Gere visualizações lógicas de qualquer tema complexo em segundos para memorização turbo.</p>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#22d3ee' }}>R$ 2,00<small style={{ fontSize: '12px', color: '#71717a' }}> /único</small></div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <footer style={{ padding: '60px 20px', textAlign: 'center', borderTop: '1px solid #27272a', color: '#71717a' }}>
        <p>© 2026 GABARITOU - CNPJ: 51.380.974/0001-89</p>
        <p style={{ marginTop: '10px', fontSize: '12px' }}>A tecnologia mais avançada de predição do mercado brasileiro.</p>
      </footer>
    </div>
  )
}
