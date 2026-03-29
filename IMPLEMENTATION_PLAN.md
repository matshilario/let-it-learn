# Let It Learn - Plano de Implementacao Completo

## Contexto

Construir do zero um SaaS multi-tenant chamado **Let It Learn** voltado para professores que dao aula online. O sistema permite criar atividades interativas (multipla escolha, V/F, associacao, etc.), compartilha-las com alunos via link aberto ou acesso autenticado, e captar indicadores de desempenho e adesao. Deploy na Railway via CLI.

**Stack**: Next.js 16 (App Router) + TypeScript + Tailwind + shadcn/ui | Python FastAPI | PostgreSQL | Redis

**Repositorio**: https://github.com/matshilario/let-it-learn

---

## Progresso Atual

| Fase | Status | Commit |
|------|--------|--------|
| Fase 1: Fundacao | CONCLUIDA | `86c6ab1` |
| Fase 2: Criador de Atividades | CONCLUIDA | `374a3fd` |
| Fase 3: Player do Aluno | PENDENTE | - |
| Fase 4: Sessoes ao Vivo | PENDENTE | - |
| Fase 5: Analytics | PENDENTE | - |
| Fase 6: Gamificacao | PENDENTE | - |
| Fase 7: Polimento | PENDENTE | - |
| Fase 8: Lancamento | PENDENTE | - |

### Notas da Fase 1 (Revisao)
- `passlib` incompativel com `bcrypt>=5.0` - substituido por `bcrypt` direto
- Removido `lazy="selectin"` excessivo dos models (mantido apenas em Activity->Questions e Question->Options)
- Rota `activities/by-code/{code}` reordenada para vir antes de `activities/{activity_id}` (conflito de parsing UUID)
- Campo `metadata` no QuestionOption model renomeado para `extra_metadata` (conflito com SQLAlchemy)
- Docker nao disponivel no WSL2 do usuario - testes com banco real pendentes

---

## Funcionalidades Completas

### Tipos de Atividade (7 tipos)
1. **Resposta em Texto** - texto livre com auto-correcao por palavras-chave
2. **Multipla Escolha** - unica ou multiplas respostas corretas, opcoes com imagem
3. **Associacao/Matching** - arrastar para conectar pares (texto-texto, texto-imagem)
4. **Verdadeiro ou Falso** - com campo opcional de justificativa
5. **Preencher Lacunas** - blanks inline, match exato ou regex
6. **Ordenacao/Sequencia** - drag-and-drop para reordenar
7. **Categorizacao** - arrastar itens para categorias corretas

### Hierarquia de Conteudo
`Instituicao (opcional) > Conta do Professor > Modulo > Aula > Atividade > Questao`

### Dois Modos de Acesso
- **Link Aberto**: URL curta + QR code, sem login, nickname opcional
- **Autenticado**: formulario simples (nome+email) ou OAuth Google/Facebook, progresso persistente

### Dashboard do Professor
- Criador de atividades com drag-and-drop
- Editor rich text (Tiptap) com suporte a imagens/midia
- Preview ao vivo das atividades
- Duplicar/clonar atividades, aulas, modulos
- Importacao em massa via CSV/XLSX
- Exportacao de resultados CSV/PDF
- QR code para cada atividade
- Gestao de turmas (criar turmas, convidar alunos)
- Gestao de instituicao

### Sessoes em Tempo Real (Live Sessions)
- Professor inicia sessao, alunos entram via codigo/QR
- Respostas em tempo real via WebSocket
- Leaderboard ao vivo
- Professor controla ritmo (travar/destravar questoes)
- Dashboard em tempo real (contagem de respostas, % conclusao)

### Gamificacao
- Pontos por resposta correta (configuravel)
- Bonus por velocidade
- Multiplicador de sequencia (streak)
- Badges/conquistas
- Leaderboard por sessao/aula/modulo
- Sistema de XP com niveis para alunos autenticados
- Animacao de podio ao final da sessao

### Timer/Cronometro
- Timer por atividade inteira ou por questao individual
- Countdown visivel com alerta nos ultimos segundos
- Auto-submit ao expirar

### Analytics e Relatorios
- **Sessao**: distribuicao de respostas, score medio, questoes mais erradas
- **Aula**: performance agregada, progresso
- **Modulo**: metricas de dominio, graficos de tendencia
- **Aluno** (autenticado): historico individual, pontos fortes/fracos
- **Exportacao**: PDF com graficos, CSV com dados brutos
- **Engajamento**: tempo medio por questao, taxa de abandono

### Funcionalidades Adicionais Essenciais
- i18n: pt-BR (primario) + en
- Design responsivo (mobile-first)
- Acessibilidade WCAG 2.1 AA
- Dark mode
- Versionamento de atividades
- Suporte a midia (imagens, audio, YouTube embarcado)
- Feedback por questao (explicacao apos responder)
- Randomizacao de questoes e opcoes
- Limite de tentativas configuravel
- Modos de correcao: automatico, manual, hibrido
- Colaboracao entre professores (compartilhar/copiar atividades)

---

## Arquitetura e Decisoes Tecnicas

| Decisao | Escolha | Justificativa |
|---------|---------|---------------|
| Estrutura | Monorepo (1 repo, 2 servicos Railway) | CI/CD simples, PRs atomicos |
| API | REST + WebSocket | REST para CRUD, WS so para live sessions |
| Config de questoes | JSONB no PostgreSQL | Evita explosao de tabelas por tipo |
| Auth | JWT + refresh tokens (backend), NextAuth.js (frontend) | NextAuth lida com OAuth; JWT stateless |
| Real-time | WebSocket + Redis pub/sub | Escala entre workers |
| Armazenamento de midia | Cloudflare R2 (prod), local (dev) | S3-compativel, zero custo de egress |
| ORM | SQLAlchemy 2.0 (async) | Maduro, Alembic para migrations |
| State management | TanStack Query + Zustand | Server state vs client state separados |
| Drag-and-drop | dnd-kit | Acessivel, performatico |
| Rich text | Tiptap | Headless, armazena JSON |
| Graficos | Recharts | React-nativo, composavel |
| PDF | WeasyPrint | HTML-to-PDF com CSS |
| i18n | next-intl | Compativel com App Router |
| Hashing de senha | bcrypt (direto) | passlib incompativel com bcrypt>=5.0 |

---

## Schema do Banco de Dados (13 Tabelas)

### `teachers` (ancora multi-tenant)
id (UUID PK), institution_id (FK NULL), email (UNIQUE), password_hash, full_name, avatar_url, locale, timezone, plan (free/pro/enterprise), is_active, email_verified, oauth_provider, oauth_id, settings (JSONB), timestamps

### `institutions`
id (UUID PK), name, slug (UNIQUE), logo_url, settings (JSONB), timestamps

### `modules`
id (UUID PK), teacher_id (FK), title, description, cover_image_url, is_published, sort_order, settings (JSONB), timestamps

### `lessons`
id (UUID PK), module_id (FK), teacher_id (FK), title, description, sort_order, is_published, timestamps

### `activities`
id (UUID PK), lesson_id (FK), teacher_id (FK), title, description, activity_type, access_mode (open/authenticated), short_code (UNIQUE), sort_order, is_published, version, time_limit_seconds, max_attempts, shuffle_questions, shuffle_options, show_feedback, show_correct_answer, passing_score, gamification (JSONB), timestamps

### `questions`
id (UUID PK), activity_id (FK), question_type, content (JSONB), media_url, hint, explanation, points, time_limit_seconds, sort_order, config (JSONB), timestamps

### `question_options`
id (UUID PK), question_id (FK), content, media_url, is_correct, sort_order, category_id, match_target_id, metadata (JSONB), timestamps

### `students`
id (UUID PK), email (UNIQUE NULL), full_name, nickname, avatar_url, oauth_provider, oauth_id, total_xp, level, timestamps

### `classes`
id (UUID PK), teacher_id (FK), institution_id (FK NULL), name, join_code (UNIQUE), is_active, timestamps

### `class_students` (junction)
class_id (FK PK), student_id (FK PK)

### `sessions`
id (UUID PK), activity_id (FK), teacher_id (FK), class_id (FK NULL), session_type (async/live), join_code (UNIQUE NULL), status, started_at, ended_at, current_question_id (FK NULL), settings (JSONB), timestamps

### `student_sessions`
id (UUID PK), session_id (FK), student_id (FK NULL), anonymous_id, nickname, score, max_score, time_spent_seconds, status, attempt_number, started_at, completed_at, timestamps

### `responses`
id (UUID PK), student_session_id (FK), question_id (FK), answer (JSONB), is_correct (BOOL NULL), points_earned, time_spent_seconds, answered_at, timestamps

---

## Estrutura de Pastas do Projeto

```
let_it_learn/
├── frontend/                        # Next.js 16
│   ├── railway.toml
│   ├── next.config.ts
│   ├── package.json
│   ├── components.json             # shadcn/ui
│   └── src/
│       ├── app/
│       │   ├── page.tsx                        # Landing page
│       │   ├── (auth)/login/page.tsx           # Login
│       │   ├── (auth)/register/page.tsx        # Register
│       │   ├── (dashboard)/dashboard/page.tsx  # Dashboard home
│       │   ├── (dashboard)/modules/page.tsx    # Modules list
│       │   ├── (dashboard)/modules/[moduleId]/page.tsx           # Module detail
│       │   ├── (dashboard)/modules/[moduleId]/lessons/[lessonId]/page.tsx  # Lesson detail
│       │   ├── (dashboard)/modules/.../activities/[activityId]/page.tsx    # Activity builder
│       │   ├── (dashboard)/sessions/           # Sessions management
│       │   ├── (dashboard)/classes/            # Classes management
│       │   ├── (dashboard)/analytics/          # Analytics dashboard
│       │   ├── (play)/play/[shortCode]/        # Student play (by code)
│       │   ├── (play)/session/[sessionId]/     # Student session
│       │   └── api/auth/[...nextauth]/         # NextAuth handler
│       ├── components/
│       │   ├── ui/                 # shadcn/ui (19 components)
│       │   ├── layout/            # sidebar, topbar
│       │   ├── activity-builder/  # question-editor + 7 type editors
│       │   ├── activity-player/   # renderers por tipo (Fase 3)
│       │   ├── analytics/         # charts (Fase 5)
│       │   └── session/           # live session (Fase 4)
│       └── lib/
│           ├── api/               # client.ts + 6 endpoint files
│           ├── hooks/             # 5 TanStack Query hooks
│           ├── stores/            # activity-builder-store (Zustand)
│           └── types/             # TypeScript types
│
├── backend/                        # FastAPI
│   ├── railway.toml
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/
│   └── app/
│       ├── main.py                # 54 routes registered
│       ├── config.py              # pydantic-settings
│       ├── api/v1/               # 9 route files
│       ├── api/deps.py           # get_current_teacher, get_current_user_optional
│       ├── core/                 # security (bcrypt+JWT), exceptions, CORS
│       ├── domain/grading.py     # Auto-grading for 7 question types
│       ├── models/               # 13 SQLAlchemy 2.0 models
│       ├── schemas/              # 10 Pydantic v2 schema files
│       └── db/database.py        # Async engine + session
│
├── docker-compose.yml             # PostgreSQL 15 + Redis 7
├── Makefile
├── CLAUDE.md
└── IMPLEMENTATION_PLAN.md         # Este arquivo
```

---

## API Endpoints (54 rotas)

### Auth (`/api/v1/auth`)
- `POST /register` - Registro do professor
- `POST /login` - Login (retorna JWT)
- `POST /refresh` - Refresh token
- `GET /me` - Perfil do professor
- `PUT /me` - Atualizar perfil

### Modules (`/api/v1/modules`)
- `GET /` - Listar modulos (paginado)
- `POST /` - Criar modulo
- `GET /{id}` - Detalhe
- `PUT /{id}` - Atualizar
- `DELETE /{id}` - Excluir
- `POST /{id}/duplicate` - Duplicar
- `PUT /{id}/publish` - Publicar/despublicar

### Lessons (`/api/v1`)
- `GET /modules/{mid}/lessons` - Listar aulas do modulo
- `POST /modules/{mid}/lessons` - Criar aula
- `GET /lessons/{id}` - Detalhe
- `PUT /lessons/{id}` - Atualizar
- `DELETE /lessons/{id}` - Excluir

### Activities (`/api/v1`)
- `GET /lessons/{lid}/activities` - Listar atividades da aula
- `POST /lessons/{lid}/activities` - Criar atividade
- `GET /activities/by-code/{code}` - Buscar por short_code
- `GET /activities/{id}` - Detalhe
- `PUT /activities/{id}` - Atualizar
- `DELETE /activities/{id}` - Excluir
- `GET /activities/{id}/qrcode` - Gerar QR code (PNG)

### Questions (`/api/v1`)
- `GET /activities/{aid}/questions` - Listar questoes
- `POST /activities/{aid}/questions` - Criar questao (com opcoes)
- `PUT /questions/{id}` - Atualizar questao (substitui opcoes)
- `DELETE /questions/{id}` - Excluir

### Sessions (`/api/v1/sessions`)
- `POST /` - Criar sessao
- `GET /` - Listar sessoes (paginado)
- `GET /{id}` - Detalhe
- `PUT /{id}` - Atualizar status/questao atual
- `POST /{id}/end` - Encerrar sessao
- `GET /{id}/results` - Resultados (student_sessions)

### Play (`/api/v1/play`) - Student-facing
- `GET /{short_code}` - Info da atividade
- `POST /join` - Entrar na sessao (join_code + nickname)
- `POST /{session_id}/start` - Iniciar tentativa
- `POST /{session_id}/answer` - Submeter resposta (com auto-grading)
- `POST /{session_id}/complete` - Completar tentativa
- `GET /{session_id}/results` - Resultados pessoais

### Classes (`/api/v1/classes`)
- `GET /` - Listar turmas
- `POST /` - Criar turma
- `GET /{id}` - Detalhe (com alunos)
- `PUT /{id}` - Atualizar
- `DELETE /{id}` - Excluir
- `POST /{id}/students` - Adicionar aluno
- `DELETE /{id}/students/{sid}` - Remover aluno

### Analytics (`/api/v1/analytics`)
- `GET /dashboard` - Stats gerais do professor
- `GET /sessions/{id}` - Analytics da sessao (com breakdown por questao)

---

## Deploy Railway

```
Railway Project: "let-it-learn"
├── Service: "frontend"     (Next.js, port 3000, /frontend)
├── Service: "backend"      (FastAPI, port 8000, /backend)
├── Plugin: "postgres"      (PostgreSQL)
└── Plugin: "redis"         (Redis - WebSocket pub/sub, cache)
```

**railway.toml (backend)**: nixpacks, uvicorn 4 workers, healthcheck /health
**railway.toml (frontend)**: nixpacks, npm start, healthcheck /

---

## Fases de Implementacao (Detalhado)

### Fase 1: Fundacao - CONCLUIDA
- [x] Monorepo: git, .gitignore, CLAUDE.md, docker-compose.yml, Makefile
- [x] Backend: FastAPI + config + database + Alembic + 13 models
- [x] Backend: Auth (register, login, JWT access/refresh, bcrypt)
- [x] Backend: CRUD modules + lessons + activities + questions + sessions + play + classes + analytics
- [x] Backend: Motor de auto-correcao (7 tipos de questao)
- [x] Frontend: Next.js 16 + Tailwind + 16 shadcn/ui components
- [x] Frontend: NextAuth.js + paginas login/register
- [x] Frontend: Dashboard layout (sidebar + topbar)
- [x] Frontend: Dashboard home + modulos page
- [x] Frontend: API client (Axios + JWT interceptor)
- [x] Frontend: TanStack Query hooks + TypeScript types

### Fase 2: Criador de Atividades - CONCLUIDA
- [x] Frontend: Pagina detalhe do modulo (lista aulas, CRUD)
- [x] Frontend: Pagina detalhe da aula (lista atividades, CRUD)
- [x] Frontend: Activity Builder com layout split (questoes + settings)
- [x] Frontend: Lista de questoes sortable (dnd-kit)
- [x] Frontend: Question type picker (7 tipos)
- [x] Frontend: 7 editores de questao tipo-especificos
- [x] Frontend: Painel de configuracoes da atividade
- [x] Frontend: QR code + short code copy
- [x] Frontend: Zustand store para builder
- [x] Frontend: Landing page
- [x] Frontend: Hooks use-activities, use-questions
- [x] Frontend: 3 novos componentes shadcn (switch, textarea, breadcrumb)

### Fase 3: Player do Aluno - PROXIMO
- [ ] Frontend: Pagina de entrada do aluno (short_code ou join_code)
- [ ] Frontend: Tela de identificacao (nickname para open, login para authenticated)
- [ ] Frontend: Player shell (navegacao entre questoes, progress bar)
- [ ] Frontend: 7 renderers interativos (um por tipo de questao)
- [ ] Frontend: Timer/countdown display
- [ ] Frontend: Pagina de resultados (score, acertos/erros, explicacoes)
- [ ] Frontend: Zustand store para player state
- [ ] Frontend: Hook use-player + API play endpoints
- [ ] Backend: Validacoes adicionais no play (tentativas, timer expirado)

### Fase 4: Sessoes ao Vivo e Real-Time
- [ ] Backend: WebSocket manager (FastAPI WebSocket + Redis pub/sub)
- [ ] Backend: WebSocket handlers (join, answer, question_changed, results)
- [ ] Backend: Endpoints live session control (next question, lock, unlock)
- [ ] Frontend: Pagina de monitor para professor (real-time)
- [ ] Frontend: Controles de sessao (proximo, travar, encerrar)
- [ ] Frontend: Join de sessao live para aluno
- [ ] Frontend: Leaderboard ao vivo
- [ ] Frontend: Hook use-websocket
- [ ] Redis no Railway

### Fase 5: Analytics e Relatorios
- [ ] Backend: Engine de analytics (queries agregadas por modulo/aula/aluno)
- [ ] Backend: Export CSV
- [ ] Backend: Export PDF (WeasyPrint)
- [ ] Frontend: Dashboard de analytics (Recharts)
- [ ] Frontend: Graficos: distribuicao de scores, tempo, dificuldade por questao
- [ ] Frontend: Gradebook da turma
- [ ] Frontend: Botoes de export CSV/PDF

### Fase 6: Gamificacao
- [ ] Backend: Engine de pontos (time bonus, streak multiplier)
- [ ] Backend: Sistema de badges (criteria evaluation)
- [ ] Backend: XP + niveis para alunos
- [ ] Frontend: Display de pontos durante gameplay
- [ ] Frontend: Animacoes de badge
- [ ] Frontend: Podio animado ao final
- [ ] Frontend: Perfil do aluno com XP/level/badges
- [ ] Frontend: Config de gamificacao por atividade

### Fase 7: Polimento e Funcionalidades Avancadas
- [ ] i18n (pt-BR + en) com next-intl
- [ ] Dark mode completo
- [ ] Acessibilidade (WCAG 2.1 AA)
- [ ] Templates de atividade (criar, usar, listar publicos)
- [ ] Importacao em massa de questoes (CSV/XLSX)
- [ ] Upload de midia (Cloudflare R2)
- [ ] Versionamento de atividades
- [ ] Responsividade mobile completa
- [ ] Colaboracao entre professores

### Fase 8: Preparacao para Lancamento
- [ ] Rate limiting (Redis)
- [ ] Error tracking (Sentry)
- [ ] Performance optimization (query caching)
- [ ] SEO para landing page
- [ ] Documentacao API (Swagger/ReDoc ja funcionam em /docs)
- [ ] Testes de carga
- [ ] Auditoria de seguranca
- [ ] Deploy producao Railway com dominio customizado

---

## Verificacao / Como Testar

1. **Backend**: `cd backend && source venv/bin/activate && python3 -c "from app.main import app"`
2. **Frontend**: `cd frontend && npm run build`
3. **Local completo**: `docker-compose up -d` (Postgres + Redis) -> `make migrate` -> `make dev-backend` -> `make dev-frontend`
4. **Fluxo E2E**: Registrar professor -> criar modulo -> criar aula -> criar atividade com questoes -> publicar -> acessar via short_code como aluno -> responder -> ver resultados
5. **Railway**: `railway up` em cada servico
6. **Grading**: `python3 -c "from app.domain.grading import grade_response"` (testes unitarios passam para todos os 7 tipos)
