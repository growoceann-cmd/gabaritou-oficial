import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import AccuracyBadge from '../components/AccuracyBadge'
import ShareButton from '../components/ShareButton'

const MOCK_DETAIL = {
  r1: {
    concurso: 'TRF-3 — Técnico Judiciário',
    banca: 'CEBRASPE',
    data: '2024-11-15',
    acuracia: 82,
    totalQuestoes: 100,
    acertos: 82,
    temasMapeados: 65,
    temasAcertados: 53,
    topicos: [
      { topico: 'Controle de Constitucionalidade', probabilidade: 92, caiu: true, acertou: true },
      { topico: 'Licitações (Lei 14.133/21)', probabilidade: 85, caiu: true, acertou: true },
      { topico: 'Modelos de Gestão Pública', probabilidade: 80, caiu: true, acertou: false },
      { topico: 'Proposições e Conectivos', probabilidade: 78, caiu: true, acertou: true },
      { topico: 'Interpretação Textual', probabilidade: 75, caiu: false, acertou: null },
      { topico: 'Princípios Administrativos', probabilidade: 88, caiu: true, acertou: true },
      { topico: 'Competências Constitucionais', probabilidade: 83, caiu: true, acertou: true },
      { topico: 'Balanço Patrimonial', probabilidade: 71, caiu: true, acertou: false },
      { topico: 'Crase e Pontuação', probabilidade: 69, caiu: true, acertou: true },
      { topico: 'Segurança da Informação', probabilidade: 65, caiu: false, acertou: null },
      { topico: 'Responsabilidade Civil', probabilidade: 77, caiu: true, acertou: true },
      { topico: 'Atos Administrativos', probabilidade: 86, caiu: true, acertou: true },
    ],
  },
  r2: {
    concurso: 'TJ-SP — Escrevente Técnico Judiciário',
    banca: 'VUNESP',
    data: '2024-11-10',
    acuracia: 76,
    totalQuestoes: 90,
    acertos: 68,
    temasMapeados: 55,
    temasAcertados: 42,
    topicos: [
      { topico: 'Direito Constitucional — Remédios Constitucionais', probabilidade: 85, caiu: true, acertou: true },
      { topico: 'Direito Civil — Contratos', probabilidade: 80, caiu: true, acertou: true },
      { topico: 'Língua Portuguesa — Concordância', probabilidade: 78, caiu: true, acertou: false },
      { topico: 'Direito Administrativo — Servidores', probabilidade: 74, caiu: true, acertou: true },
      { topico: 'Informática — Segurança', probabilidade: 70, caiu: false, acertou: null },
      { topico: 'Noções de Direito Processual Civil', probabilidade: 82, caiu: true, acertou: true },
      { topico: 'Raciocínio Lógico — Equivalências', probabilidade: 76, caiu: true, acertou: false },
      { topico: 'Regimento Interno TJ-SP', probabilidade: 88, caiu: true, acertou: true },
    ],
  },
  r3: {
    concurso: 'Polícia Federal — Agente',
    banca: 'CEBRASPE',
    data: '2024-11-05',
    acuracia: 85,
    totalQuestoes: 120,
    acertos: 102,
    temasMapeados: 80,
    temasAcertados: 68,
    topicos: [
      { topico: 'Direito Penal — Crimes contra a Administração', probabilidade: 90, caiu: true, acertou: true },
      { topico: 'Direito Constitucional — Poder de Polícia', probabilidade: 87, caiu: true, acertou: true },
      { topico: 'Legislação Especial — Lei de Drogas', probabilidade: 93, caiu: true, acertou: true },
      { topico: 'Investigação Criminal', probabilidade: 85, caiu: true, acertou: true },
      { topico: 'Direito Processual Penal — Prova', probabilidade: 82, caiu: true, acertou: true },
      { topico: 'Português — Compreensão Textual', probabilidade: 79, caiu: true, acertou: false },
      { topico: 'Informática — Redes', probabilidade: 73, caiu: true, acertou: true },
      { topico: 'Raciocínio Lógico — Diagramas Lógicos', probabilidade: 77, caiu: true, acertou: true },
      { topico: 'Administração Pública — Ética', probabilidade: 81, caiu: true, acertou: true },
      { topico: 'Contabilidade — Balancete', probabilidade: 68, caiu: false, acertou: null },
    ],
  },
}

export default function AccuracyDetail({ onMenuClick }) {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setReport(MOCK_DETAIL[id] || MOCK_DETAIL.r1)
      setLoading(false)
    }, 400)
    return () => clearTimeout(timer)
  }, [id])

  if (loading) {
    return (
      <div className="page">
        <div className="loading-container">
          <div className="spinner" />
          <span>Carregando relatório...</span>
        </div>
      </div>
    )
  }

  if (!report) return null

  const hitRate = report.topicos.filter(t => t.caiu && t.acertou).length
  const appearedRate = report.topicos.filter(t => t.caiu).length

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <button className="btn btn-icon btn-outline" onClick={onMenuClick}>☰</button>
          <Link to="/acuracia" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            ← Voltar
          </Link>
        </div>
        <h1>📈 Relatório — {report.concurso}</h1>
        <p>{report.banca} • {new Date(report.data).toLocaleDateString('pt-BR')}</p>
      </div>

      {/* Main Score */}
      <div className="card" style={{ textAlign: 'center', marginBottom: 24, padding: 32 }}>
        <AccuracyBadge value={report.acuracia} size={140} />
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>
            Acurácia Geral
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {report.acertos} de {report.totalQuestoes} questões previstas corretamente
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="content-grid-4" style={{ marginBottom: 32 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text)' }}>{report.totalQuestoes}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Total questões</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--neon)' }}>{report.acertos}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Acertos</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--cyan)' }}>{report.temasMapeados}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Temas mapeados</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--gold)' }}>{report.temasAcertados}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Temas acertados</div>
        </div>
      </div>

      {/* Breakdown by Topic */}
      <div className="section-title">
        <span className="icon">📋</span>
        Detalhamento por Tópico
      </div>

      <div className="table-container" style={{ marginBottom: 32 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Tópico</th>
              <th style={{ width: 120 }}>Prob. Prevista</th>
              <th style={{ width: 100 }}>Caiu?</th>
              <th style={{ width: 100 }}>Acertou?</th>
            </tr>
          </thead>
          <tbody>
            {report.topicos.map((topico, idx) => (
              <tr key={idx}>
                <td style={{ fontWeight: 500 }}>{topico.topico}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="progress-bar progress-bar-sm" style={{ flex: 1 }}>
                      <div
                        className={`progress-bar-fill ${topico.probabilidade >= 80 ? 'neon' : topico.probabilidade >= 50 ? 'gold' : 'red'}`}
                        style={{ width: `${topico.probabilidade}%` }}
                      />
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)', minWidth: 36 }}>
                      {topico.probabilidade}%
                    </span>
                  </div>
                </td>
                <td>
                  {topico.caiu ? (
                    <span className="badge badge-green">✓ Sim</span>
                  ) : (
                    <span className="badge" style={{ background: 'var(--surface)', color: 'var(--text-dim)', border: '1px solid var(--border)' }}>✗ Não</span>
                  )}
                </td>
                <td>
                  {topico.acertou === true ? (
                    <span className="badge badge-green">✓ Sim</span>
                  ) : topico.acertou === false ? (
                    <span className="badge badge-red">✗ Não</span>
                  ) : (
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Share Section */}
      <div className="section-title">
        <span className="icon">📤</span>
        Compartilhar Resultado
      </div>

      <div className="share-card" style={{ marginBottom: 32 }}>
        <div className="share-card-title">GABARITOU SCORE</div>
        <div className="share-card-score">{report.acuracia}%</div>
        <div className="share-card-subtitle">{report.concurso}</div>
        <ShareButton
          concurso={report.concurso}
          acuracia={report.acuracia}
          totalQuestoes={report.totalQuestoes}
        />
      </div>
    </div>
  )
}
