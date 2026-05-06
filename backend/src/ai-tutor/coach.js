/**
 * AI Tutor Coach — Gabaritou v3 (Modelo BeConfident)
 * 
 * MUDANÇA CRÍTICA vs v2:
 * Antes: coach.js funcionava como Q&A passivo (user pergunta → AI responde)
 * Agora: coach.js é ATIVO — gera cenários, propõe exercícios, avalia respostas
 * 
 * O coach não espera uma pergunta. Ele PROPOE.
 * O feedback é emocionless (sem "parabéns!", sem emojis excessivos).
 * Focado em dados e correção precisa.
 */

import OpenAI from 'openai';
import dashScope from '../services/dashscope.js';
import graphRAG from '../rag/graph-rag.js';
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

/**
 * Gera uma questão de cenário baseada no tópico e nível do usuário.
 * @param {Object} params
 * @param {string} params.topico - Tópico para a questão
 * @param {number} params.level - Nível adaptativo (1-6)
 * @param {string} params.banca - Banca examinadora
 * @param {string} params.materia - Matéria
 * @param {string} params.prevContext - Contexto anterior da conversa
 * @returns {Promise<{question: string, correctAnswer: string, explanation: string, difficulty: number}>}
 */
export async function generateScenarioQuestion({ topico, level = 1, banca = 'CESPE', materia, prevContext = '' }) {
  const levelInfo = ADAPTIVE_LEVELS.find((l) => l.level === level) || ADAPTIVE_LEVELS[0];

  // Injeção de GraphRAG (Teia de Conhecimento)
  const graphContext = await graphRAG.getEnrichedContext(topico);

  const prompt = `Gere uma questão de ${materia} sobre "${topico}" para o nível ${level} (${levelInfo.description}).
Banca: ${banca}. Formato: alternativa única (A-D).

CONTEXTO DA TEIA DE CONHECIMENTO:
${graphContext}

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
    const aiResponse = await dashScope.generateResponse([
      { role: 'system', content: COACH_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ], { temperature: 0.8 });

    // Tratamento robusto para o formato de resposta do Qwen 3.6 (que pode vir com blocos de pensamento)
    let cleanContent = aiResponse.trim();
    if (cleanContent.includes('```json')) {
      cleanContent = cleanContent.split('```json')[1].split('```')[0].trim();
    } else if (cleanContent.includes('```')) {
      cleanContent = cleanContent.split('```')[1].split('```')[0].trim();
    }

    const content = cleanContent;


    // Extrair JSON da resposta
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

    throw new Error('Resposta da IA não contém JSON válido');
  } catch (err) {
    log.error('Erro ao gerar questão cenário', {
      topico, level, banca, erro: err.message,
    });

    // Fallback: questão hardcoded
    return generateFallbackQuestion(topico, banca);
  }
}

/**
 * Avalia a resposta do usuário e gera feedback emocionless.
 * @param {Object} params
 * @param {string} params.userAnswer - Resposta do usuário
 * @param {string} params.correctAnswer - Resposta correta
 * @param {string} params.explanation - Explicação
 * @param {string} params.armadilha - Armadilha (se houver)
 * @param {number} params.questionDifficulty - Dificuldade da questão
 * @returns {Promise<{isCorrect: boolean, feedback: string, nextLevel: number}>}
 */
export async function evaluateUserAnswer({ userAnswer, correctAnswer, explanation, armadilha, questionDifficulty }) {
  const normalizedUser = (userAnswer || '').trim().toUpperCase().replace(/[^A-D]/g, '');
  const normalizedCorrect = correctAnswer.trim().toUpperCase().replace(/[^A-D]/g, '');
  const isCorrect = normalizedUser === normalizedCorrect;

  // Feedback emocionless
  let feedback = '';

  if (isCorrect) {
    feedback = `✅ Correta — ${explanation}`;
  } else {
    feedback = `❌ Incorreta — A alternativa correta é *${normalizedCorrect}*. ${explanation}`;
    if (armadilha) {
      feedback += `\n\n⚠️ *Armadilha:* ${armadilha}`;
    }
  }

  // Calcular próximo nível adaptativo
  let nextLevel = questionDifficulty;
  // O ajuste real é feito pelo session manager baseado no histórico

  return { isCorrect, feedback, nextLevel };
}

/**
 * Gera uma transição natural entre o contexto da conversa e a micro-sessão.
 * O segredo do BeConfident: não parece "modo estudo", parece continuação.
 * @param {string} contextText - Texto do contexto da conversa
 * @param {string} topic - Tópico que vai ser perguntado
 * @returns {Promise<string>}
 */
export async function generateNaturalTransition(contextText, topic) {
  const prompt = `O usuário do Telegram está conversando naturalmente. Últimas mensagens:
"${contextText}"

Preciso que você crie uma TRANSIÇÃO NATURAL de no máximo 2 frases que leve para uma questão sobre "${topic}".
A transição não pode parecer "agora vamos estudar". Deve fluir naturalmente da conversa.

Exemplos de boa transição:
- "Falando nisso, que tal testar um ponto que costuma cair bastante?"
- "Curiosidade: você saberia responder algo sobre [tópico]?"

Gere APENAS a frase de transição. Sem emojis excessivos.`;

  try {
    const aiResponse = await dashScope.generateResponse([
      { role: 'user', content: prompt }
    ], { temperature: 0.8, max_tokens: 100 });

    return aiResponse?.trim() || `Sobre ${topic}:`;
  } catch {
    return `Teste rápido sobre ${topic}:`;
  }
}

/**
 * Responde naturalmente a uma mensagem do usuário quando não há interceptação.
 * @param {string} userMessage - Mensagem do usuário
 * @param {Array} context - Contexto da conversa
 * @param {Object} user - Dados do usuário
 * @returns {Promise<string>}
 */
export async function respondNaturally(userMessage, context, user) {
  const messages = [
    { role: 'system', content: COACH_SYSTEM_PROMPT },
    ...context.slice(-6),
    { role: 'user', content: userMessage },
  ];

  try {
    const aiResponse = await dashScope.generateResponse(messages, { temperature: 0.7 });

    return aiResponse || '';
  } catch (err) {
    log.error('Erro na resposta natural', { erro: err.message });
    return null;
  }
}

// ─── Fallback ─────────────────────────────────────────────────────

function generateFallbackQuestion(topico, banca) {
  return {
    question: `📝 *Tópico: ${topico}*\n📊 Dificuldade: 3/6\n\nSobre ${topico}, considerando a jurisprudência predominante e a legislação vigente aplicável à banca ${banca}, assinale a alternativa correta:\n\nA) O tema é regulado exclusivamente pela Constituição Federal\nB) A aplicação do tema deve observar os princípios da legalidade e impessoalidade\nC) O regime jurídico do tema permite exceções expressamente previstas em lei\nD) A matéria é de competência exclusiva da União\n\n_Responda com a letra._`,
    correctAnswer: 'C',
    explanation: `A alternativa C está correta: o regime jurídico aplicável ao tema admite exceções quando previstas em lei, desde que fundamentadas no interesse público.`,
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
