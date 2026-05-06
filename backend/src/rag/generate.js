/**
 * RAG Generate — Gabaritou v3 (Modelo BeConfident)
 * 
 * MUDANÇA CRÍTICA vs v2:
 * Antes: System prompt passivo — "responda às dúvidas do usuário"
 * Agora: System prompt ATIVO — "analise contexto, proponha exercícios, avalie respostas"
 * 
 * O prompt é injetado em TODAS as chamadas à IA, não só no /tutor.
 */

export const SYSTEM_PROMPT_V3 = `Você é o assistente do Gabaritou, um bot Telegram para concurseiros.

IDENTIDADE E COMPORTAMENTO:
- Você é um coach de estudos ativo, não um FAQ
- Suas respostas vêm do contexto da conversa + banco de predições + nível do usuário
- Você NUNCA diz "é só digitar /comando" — você interage naturalmente
- SEM emojis excessivos, SEM "parabéns!", SEM motivacional barato
- Feedback = dados + explicação técnica. Nada de emoção.

REGRAS DE CONDUTA:
1. ANALISE o contexto antes de responder (últimas mensagens do usuário)
2. Se o contexto sugere um tópico de estudo, PROPOA um teste rápido (1 questão)
3. Se o usuário acerta, avança. Se erra, explica e reforça
4. NUNCA invente dados — use apenas o que está no contexto ou nas predições fornecidas
5. Questões devem seguir o formato da banca examinadora correspondente
6. Cite sempre a base legal (artigo, lei, súmula) quando aplicável

FORMATO DE QUESTÃO:
📝 *Tópico: [nome]*
📊 Nível: [1-6]

[Enunciado]

A) [alternativa]
B) [alternativa]  
C) [alternativa]
D) [alternativa]

_Responda com a letra._

FORMATO DE FEEDBACK:
✅ Correta — [explicação técnica]
❌ Incorreta — A correta é [X]. [explicação + armadilha]

PREDIÇÕES (quando fornecidas no contexto):
- Use as predições para PRIORIZAR os tópicos
- Informe a probabilidade de cair: "Tópico com 92% de probabilidade"
- Destaque armadilhas da banca

DADOS DO USUÁRIO (quando fornecidos no contexto):
- Nível adaptativo: ajuste dificuldade das questões
- Pontos fracos: priorize reforço
- Fadiga: se alta, não proponha exercícios
- Banca principal: formate questões no estilo da banca`;

/**
 * Gera o prompt completo com contexto do usuário para a IA.
 * @param {Object} params
 * @param {string} params.userMessage - Mensagem atual do usuário
 * @param {Array} params.context - Histórico de mensagens
 * @param {Object} params.userData - Dados do usuário
 * @param {Object} params.prediction - Predição mais relevante (opcional)
 * @param {string} params.adaptiveLevel - Nível adaptativo
 * @returns {Array} Messages para a API da OpenAI
 */
export function buildPromptWithContext({ userMessage, context = [], userData = {}, prediction = null, adaptiveLevel = 1 }) {
  const messages = [{ role: 'system', content: SYSTEM_PROMPT_V3 }];

  // Injetar dados do usuário no contexto
  let userContext = '';

  if (userData.banca_principal) {
    userContext += `\nBanca principal do usuário: ${userData.banca_principal}`;
  }
  if (userData.cargo_alvo) {
    userContext += `\nCargo alvo: ${userData.cargo_alvo}`;
  }
  if (adaptiveLevel) {
    userContext += `\nNível adaptativo: ${adaptiveLevel}/6`;
  }

  if (prediction) {
    userContext += `\n\nPREDIÇÃO MAIS RELEVANTE:\n`;
    userContext += `- Tópico: ${prediction.topico} (${prediction.probabilidade}% de probabilidade)\n`;
    userContext += `- Banca: ${prediction.banca}\n`;
    if (prediction.armadilhas?.length) {
      userContext += `- Armadilhas: ${prediction.armadilhas.slice(0, 2).join('; ')}\n`;
    }
  }

  if (userContext) {
    messages.push({ role: 'system', content: userContext });
  }

  // Histórico da conversa
  for (const msg of context.slice(-8)) {
    messages.push({
      role: msg.role === 'bot' ? 'assistant' : msg.role,
      content: msg.text,
    });
  }

  // Mensagem atual
  messages.push({ role: 'user', content: userMessage });

  return messages;
}

/**
 * Gera prompt para análise de questões do edital (RAG).
 * @param {string} topic - Tópico para buscar
 * @param {number} topK - Número de resultados
 * @returns {string} Query para busca de embeddings
 */
export function buildRAGQuery(topic, topK = 5) {
  return `Questões e conteúdo sobre ${topic} em concursos públicos brasileiros, incluindo jurisprudência, legislação e doutrina aplicável`;
}

export default {
  SYSTEM_PROMPT_V3,
  buildPromptWithContext,
  buildRAGQuery,
};
