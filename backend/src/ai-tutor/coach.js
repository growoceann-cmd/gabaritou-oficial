/**
 * AI Tutor Coach — Gabaritou v3 (Modelo BeConfident)
 */

import OpenAI from 'openai';
import { query, queryOne } from '../db/connection.js';
import { ADAPTIVE_LEVELS, FEEDBACK } from '../config/constants.js';
import logger from '../utils/logger.js';

const log = logger.child('Coach');

// ─── OpenAI Client ───────────────────────────────────────────────
let openai = null;

function getOpenAI() {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || undefined,
    });
  }
  return openai;
}

// ─── System Prompt (ATIVO — BeConfident Model) ───────────────────

const COACH_SYSTEM_PROMPT = `Você é o coach de estudos do Gabaritou — um assistente para concurseiros que funciona dentro do Telegram.

REGRAS FUNDAMENTAIS:
1. VOCÊ É ATIVO. Não espere o usuário pedir uma questão. PROPOA cenários e exercícios baseados no contexto da conversa.
2. SEM EMOÇÃO. Feedback baseado em dados. Nunca use "parabéns!", "muito bem!", "continue assim!". Diga o que está certo e o que está errado, com a explicação técnica.
3. CENÁRIOS REAIS. Suas questões devem simular o formato de banca examinadora (CESPE, FGV, FCC, VUNESP).
4. ADAPTAÇÃO. Ajuste a dificuldade ao nível do usuário (1-6). Se ele erra muito, facilite. Se acerta tudo, dificulte.
5. MICRO-SESSÃO. Cada interação deve ser curta (1-3 questões). Não sobrecarregue.

FORMATO DE QUESTÃO:
Use este formato no Telegram:
📝 *Tópico: [nome do tópico]*
📊 Dificuldade: [nível 1-6]

[Enunciado da questão no estilo da banca]

A) [alternativa]
B) [alternativa]
C) [alternativa]
D) [alternativa]

_Responda com a letra da alternativa correta._

FORMATO DE FEEDBACK:
✅ Correta — [explicação técnica precisa, referindo lei/súmula]
❌ Incorreta — A correta é [X]. [explicação da armadilha]

NUNCA:
- Use emojis excessivos ou motivacionais
- Dê respostas genéricas tipo "estude mais"
- Pule a explicação técnica
- Invente leis ou súmulas — cite apenas as reais
`;

// ─── Gerar Questão Cenário ───────────────────────────────────────

export async function generateScenarioQuestion({ topico, level = 1, banca = 'CESPE', materia, prevContext = '' }) {
  const ai = getOpenAI();

  const levelInfo = ADAPTIVE_LEVELS.find((l) => l.level === level) || ADAPTIVE_LEVELS[0];

  const prompt = `Gere uma questão de ${materia} sobre "${topico}" para o nível ${level} (${levelInfo.description}).
Banca: ${banca}. Formato: alternativa única (A-D).
${prevContext ? `Contexto anterior da conversa do usuário: "${prevContext}"` : ''}

IMPORTANTE:
- A dificuldade deve corresponder ao nível ${level}
- Use estilo de cobrança típico da banca ${banca}
- Inclua uma armadilha sutil se nível >= 3
- Questões situacionais se nível >= 4

Responda EXCLUSIVAMENTE em JSON:
{
  "enunciado": "...",
  "alternativas": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "gabarito": "C",
  "explicacao": "...",
  "armadilha": "... ou null"
}`;

  try {
    const completion = await ai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: COACH_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const content = completion.choices[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        question: `📝 *Tópico: ${topico}*\n📊 Dificuldade: ${level}/6\n\n${parsed.enunciado}\n\n${parsed.alternativas.join('\n')}\n\n_Responda com a letra da alternativa correta._`,
        correctAnswer: parsed.gabarito,
        explanation: parsed.explicacao,
        armadilha: parsed.armadilha || null,
        difficulty: level,
      };
    }
    throw new Error('JSON inválido');
  } catch (err) {
    return generateFallbackQuestion(topico, banca);
  }
}

export async function evaluateUserAnswer({ userAnswer, correctAnswer, explanation, armadilha, questionDifficulty }) {
  const normalizedUser = (userAnswer || '').trim().toUpperCase().replace(/[^A-D]/g, '');
  const normalizedCorrect = correctAnswer.trim().toUpperCase().replace(/[^A-D]/g, '');
  const isCorrect = normalizedUser === normalizedCorrect;

  let feedback = '';
  if (isCorrect) {
    feedback = `✅ Correta — ${explanation}`;
  } else {
    feedback = `❌ Incorreta — A alternativa correta é *${normalizedCorrect}*. ${explanation}`;
    if (armadilha) feedback += `\n\n⚠️ *Armadilha:* ${armadilha}`;
  }

  return { isCorrect, feedback, nextLevel: questionDifficulty };
}

export async function generateNaturalTransition(contextText, topic) {
  const ai = getOpenAI();
  const prompt = `Últimas mensagens: "${contextText}". Crie uma transição natural para uma questão sobre "${topic}". Máximo 2 frases. Sem emojis.`;
  try {
    const completion = await ai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 100,
    });
    return completion.choices[0]?.message?.content?.trim() || `Sobre ${topic}:`;
  } catch {
    return `Teste rápido sobre ${topic}:`;
  }
}

export async function respondNaturally(userMessage, context, user) {
  const ai = getOpenAI();
  const messages = [
    { role: 'system', content: COACH_SYSTEM_PROMPT },
    ...context.slice(-6),
    { role: 'user', content: userMessage },
  ];
  try {
    const completion = await ai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });
    return completion.choices[0]?.message?.content || '';
  } catch {
    return null;
  }
}

function generateFallbackQuestion(topico, banca) {
  return {
    question: `📝 *Tópico: ${topico}*\n📊 Dificuldade: 3/6\n\nSobre ${topico}, assinale a alternativa correta:\n\nA) Tema regulado pela CF\nB) Observa legalidade\nC) Permite exceções legais\nD) Competência da União\n\n_Responda com a letra._`,
    correctAnswer: 'C',
    explanation: `Correta C: o regime jurídico permite exceções legais.`,
    armadilha: null,
    difficulty: 3,
  };
}

export default {
  generateScenarioQuestion,
  evaluateUserAnswer,
  generateNaturalTransition,
  respondNaturally,
};
