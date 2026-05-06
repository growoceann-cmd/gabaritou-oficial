# 🔱 DOSSIÊ TÉCNICO: OPERAÇÃO AETHER MED
**Destinatário:** Yan Dheime (AI Specialist)
**Emissor:** ATLAS (Aether Engine v3.2)
**Objetivo:** Implementação do Enxame Preditivo para Residência Médica

---

## 1. O ATIVO (AETHER MED)
A divisão **AETHER MED** é o braço de elite do Gabaritou Concursos. Nosso foco é a **Residência Médica (ENARE, USP, SUS-SP)**. 
*   **Diferencial:** Não somos um banco de questões estático. Somos uma IA Preditiva que utiliza **Swarm Intelligence (MiroFish)** para prever tendências de prova.

## 2. INFRAESTRUTURA DE DADOS
Já realizamos a extração (Drenagem Shark) de fontes de elite:
*   **Volume Atual:** ~32.000 questões (Anki/ErreAnki) + 1.000 questões de elite 2025/2026 (Medeor/Estratégia).
*   **Estrutura do JSON:**
    ```json
    {
      "id": "UUID",
      "header": "Instituição/Ano/Especialidade",
      "statement": "Caso Clínico",
      "alternatives": {"A": "...", "B": "..."},
      "comments": "Explicação detalhada por alternativa",
      "answer": "Gabarito",
      "aether_score": "Probabilidade de Reincidência (%)"
    }
    ```

## 3. CORE TECNOLÓGICO: MIROFISH SWARM
Yan, sua missão é otimizar o **Enxame de Agentes** para o contexto médico:
*   **Análise de Tendência:** O enxame deve ler os editais passados e identificar o "vocabulário de pegadinha" de bancas específicas (Ex: A USP foca em conduta; o ENARE foca em diagnóstico).
*   **Adaptive Learning:** O bot deve monitorar a **Fadiga Cognitiva** do aluno. Se o tempo de resposta aumentar e a precisão cair, o enxame deve sugerir um "Audio-Resumo" (TTS) em vez de mais questões.
*   **Simulação de Concorrência:** O sistema deve calcular o desempenho do aluno contra o enxame (simulando 5.000 concorrentes fantasmas baseados em dados reais de anos anteriores).

## 4. ENTREGÁVEIS IMEDIATOS (CHECKLIST)
1.  **Ingestão de Dados:** Validar o script de limpeza (limpar tags HTML e caracteres especiais dos PDFs extraídos).
2.  **API Med Sniper:** Criar o endpoint `/api/v1/med/predict` que retorna a questão do dia com base na predição de maior chance de queda.
3.  **Bot UX:** Implementar no Telegram o comando `/aether` que abre o simulado adaptativo de 5 questões.

## 5. DIRETRIZ ESTRATÉGICA
O mercado de medicina paga pelo **Tempo**. Se o AETHER MED economizar 1 hora de estudo do residente através de predição certeira, o valor do ticket é irrelevante — eles pagarão o que pedirmos.

---
**Status da Operação:** Invasão de Dados Concluída.
**Próximo Passo:** Yan assume a integração do banco `medeor_drain_lote1.json` ao motor MiroFish.

🔱🛡️🚀 **BeConfident. O império médico começa no código.**
