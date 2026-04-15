const API = '/api'

async function fetchAPI(endpoint, options = {}) {
  const url = `${API}${endpoint}`
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(url, config)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`)
    }

    if (response.status === 204) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error(`[API] ${endpoint} falhou:`, error.message)
    throw error
  }
}

// ─── Predições ─────────────────────────────────────────
export async function getPredictions(banca = '', materia = '') {
  const params = new URLSearchParams()
  if (banca) params.set('banca', banca)
  if (materia) params.set('materia', materia)
  const query = params.toString() ? `?${params.toString()}` : ''
  return fetchAPI(`/predictions${query}`)
}

export async function submitFeedback(topicoId, acertou) {
  return fetchAPI('/predictions/feedback', {
    method: 'POST',
    body: JSON.stringify({ topicoId, acertou }),
  })
}

export async function getFlywheelStats() {
  return fetchAPI('/predictions/flywheel')
}

// ─── Acurácia ──────────────────────────────────────────
export async function getAccuracyReports() {
  return fetchAPI('/accuracy')
}

export async function getAccuracyReport(id) {
  return fetchAPI(`/accuracy/${id}`)
}

// ─── Comunidade ────────────────────────────────────────
export async function getLeaderboard(concurso = '') {
  const query = concurso ? `?concurso=${encodeURIComponent(concurso)}` : ''
  return fetchAPI(`/community/leaderboard${query}`)
}

export async function getGabaritouScore(userId) {
  return fetchAPI(`/community/score/${userId}`)
}

export async function getRanking(tipo = 'geral') {
  return fetchAPI(`/community/ranking?tipo=${tipo}`)
}

// ─── AI Tutor ──────────────────────────────────────────
export async function getStudyPlan(userId) {
  return fetchAPI(`/tutor/plan/${userId}`)
}

export async function generateStudyPlan(userId, banca, cargo, horasDiarias) {
  return fetchAPI('/tutor/plan/generate', {
    method: 'POST',
    body: JSON.stringify({ userId, banca, cargo, horasDiarias }),
  })
}

export async function getTopicSummary(topicoId) {
  return fetchAPI(`/tutor/summary/${topicoId}`)
}

export async function generateAdaptiveQuiz(topicoId, dificuldade) {
  return fetchAPI('/tutor/quiz', {
    method: 'POST',
    body: JSON.stringify({ topicoId, dificuldade }),
  })
}

export async function submitQuizAnswer(questaoId, resposta) {
  return fetchAPI('/tutor/quiz/answer', {
    method: 'POST',
    body: JSON.stringify({ questaoId, resposta }),
  })
}

export async function getStudyProgress(userId) {
  return fetchAPI(`/tutor/progress/${userId}`)
}

// ─── Prova Day ─────────────────────────────────────────
export async function getProvaDayStatus(concursoId) {
  const query = concursoId ? `?concursoId=${concursoId}` : ''
  return fetchAPI(`/provaday${query}`)
}

export async function startProvaTracking(concursoId) {
  return fetchAPI('/provaday/start', {
    method: 'POST',
    body: JSON.stringify({ concursoId }),
  })
}

export async function updateProvaTracking(sessionId, topicSeen) {
  return fetchAPI('/provaday/update', {
    method: 'POST',
    body: JSON.stringify({ sessionId, topicSeen }),
  })
}

export async function finishProvaTracking(sessionId) {
  return fetchAPI('/provaday/finish', {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
  })
}

// ─── Concursos ─────────────────────────────────────────
export async function getConcursos(uf = '') {
  const query = uf ? `?uf=${uf}` : ''
  return fetchAPI(`/concursos${query}`)
}

// ─── Premium ───────────────────────────────────────────
export async function getUserLimits(userId) {
  return fetchAPI(`/premium/limits/${userId}`)
}

export async function subscribePremium(planId) {
  return fetchAPI('/premium/subscribe', {
    method: 'POST',
    body: JSON.stringify({ planId }),
  })
}

export async function getReferralStatus(userId) {
  return fetchAPI(`/premium/referral/${userId}`)
}

// ─── Admin / B2B ───────────────────────────────────────
export async function getConversionFunnel() {
  return fetchAPI('/admin/funnel')
}

export async function getPartnerStats(partnerId) {
  return fetchAPI(`/admin/partners/${partnerId}`)
}

export async function getInsightReport(tipo = 'geral', periodo = '30d') {
  return fetchAPI(`/admin/insights?tipo=${tipo}&periodo=${periodo}`)
}

export async function getAdminMetrics() {
  return fetchAPI('/admin/metrics')
}

export async function getPartners() {
  return fetchAPI('/admin/partners')
}

export async function createPartner(data) {
  return fetchAPI('/admin/partners', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getDataLicenses() {
  return fetchAPI('/admin/licenses')
}

export default fetchAPI
