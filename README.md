# 🎯 Gabaritou v3 — BeConfident Model

> Telegram Bot com IA ativa para concurseiros. O bot que faz você estudar sem perceber.

## Mudanças v2 → v3

### Modelo BeConfident: Intercepção Contextual

| Aspecto | v2 (Antes) | v3 (Agora) |
|---------|-----------|------------|
| Abordagem | Q&A passivo (user pergunta → bot responde) | Intercepção ativa (bot propõe dentro da conversa) |
| Início | Usuário abre comando `/treinar` | Bot intercepta conversa natural e propõe questão |
| Modo estudo | "Entre no modo estudo" | Sem modo estudo — tudo é fluxo contínuo |
| Feedback | "Parabéns! 🔥 Muito bem!" | Dados + explicação técnica (emoçãoless) |
| Dificuldade | Manual por matéria | Adaptativa automática por tópico (nível 1-6) |
| Predições | Apenas no `/predicao` | Injetadas em toda conversa |
| Sessões | Simulados longos (10-20 questões) | Micro-sessões (1-3 questões) |
| Fadiga | Não monitorada | Score de fadiga impede sobrecarga |

### Preços 2026

| Período | Preço |
|---------|-------|
| Lançamento (6 primeiros meses) | R$ 19,90/mês |
| Regular (após 6 meses) | R$ 24,90/mês |
| Trial | 7 dias grátis |

## Arquitetura

```
backend/
├── src/
│   ├── index.js              # Entry point (Express + Telegram Bot)
│   ├── bot/
│   │   ├── commands.js       # Comandos do bot (atualizado)
│   │   ├── callbacks.js      # Callbacks de teclado inline
│   │   ├── interceptor.js    # ★ CORE: Interceptor BeConfident
│   │   └── conversation.js   # Gerenciador de contexto
│   ├── ai-tutor/
│   │   ├── coach.js          # ★ REDIRECIONADO: Cenários ativos (não Q&A)
│   │   ├── planner.js        # ★ NOVO: Planejador adaptativo
│   │   └── session.js        # ★ NOVO: Gerenciador de micro-sessões
│   ├── prediction/
│   │   └── (via services/predictions.js)
│   ├── rag/
│   │   ├── generate.js       # System prompt ATIVO
│   │   └── search.js         # Busca pgvector
│   ├── db/
│   │   ├── schema.sql        # Schema PostgreSQL atualizado
│   │   └── connection.js     # Pool pg
│   ├── services/
│   │   ├── predictions.js    # Data Flywheel
│   │   ├── payments.js       # MercadoPago Pix
│   │   ├── concursos.js      # Concursos abertos
│   │   ├── ai-tutor.js       # AI tutor service
│   │   └── ...
│   ├── api/routes/           # Express API routes
│   ├── middleware/auth.js    # JWT, Admin, Rate Limit
│   ├── models/schemas.js     # JSDoc type definitions
│   ├── utils/                # Logger, Helpers, Cache
│   └── config/constants.js   # Precos, limites, thresholds
└── dados/
    └── cespe-diradmin.json    # Dados de predição

frontend/ (Admin Dashboard)
├── src/
│   ├── App.jsx               # Layout principal
│   ├── components/           # Sidebar, StatsCard
│   ├── pages/                # Dashboard, Users, Payments, Config
│   └── styles/global.css     # Dark theme
```

## Fluxo Principal (BeConfident)

```
Usuário manda mensagem livre
         │
         ▼
┌─── INTERCEPTOR ───┐
│  Analisa contexto  │
│  Verifica fadiga   │
│  Checa predições   │
│  Calcula inertia   │
└──────┬───────────┘
       │
       ├─ Não interceptar → Resposta natural (IA)
       │
       └─ INTERCEPTAR ─────────────────────┐
                                          ▼
                              ┌── PLANNER ──┐
                              │ Decide:     │
                              │ - Tópico    │
                              │ - Nível     │
                              │ - Ação      │
                              └──────┬──────┘
                                     │
                                     ▼
                          ┌── MICRO-SESSÃO ──┐
                          │ 1-3 questões     │
                          │ Dificuldade      │
                          │ adaptativa       │
                          │ Feedback         │
                          │ emocionless      │
                          └──────┬───────────┘
                                 │
                                 ▼
                          ┌── PROGRESS DB ──┐
                          │ Atualiza nível  │
                          │ Atualiza fadiga │
                          │ Registra hit/   │
                          │ miss             │
                          └─────────────────┘
```

## Instalação

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Editar .env com suas credenciais

# Criar banco
createdb gabaritou
psql gabaritou < src/db/schema.sql

# Iniciar
npm run dev
```

### Frontend (Admin)

```bash
cd frontend
npm install
npm run dev
```

## Variáveis de Ambiente

Veja `.env.example` para todas as variáveis necessárias:

- `BOT_TOKEN` — Token do Telegram Bot
- `DATABASE_URL` — String de conexão PostgreSQL
- `OPENAI_API_KEY` — Chave da OpenAI
- `MP_ACCESS_TOKEN` — Token MercadoPago
- `JWT_SECRET` — Chave JWT
- `ADMIN_SECRET` — Senha de admin

## Stack Tecnológica

- **Runtime:** Node.js (ES Modules)
- **Bot:** Telegraf
- **API:** Express
- **IA:** OpenAI GPT-4o-mini
- **Banco:** PostgreSQL + pgvector
- **Pagamentos:** MercadoPago (Pix)
- **Frontend Admin:** React + Vite
