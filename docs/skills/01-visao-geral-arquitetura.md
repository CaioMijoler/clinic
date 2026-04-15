# SKILL: Visão Geral da Arquitetura — Clinic Backend

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Framework | NestJS v10 |
| ORM | TypeORM v0.3 |
| Banco de Dados | MySQL (via `mysql2`) |
| Autenticação | JWT (`@nestjs/jwt` + `passport`) |
| Documentação API | Swagger (`@nestjs/swagger`) |
| Validação | `class-validator` + `class-transformer` |
| HTTP Client | Axios |
| Logging | NestJS Logger nativo |
| Integrações | Google Calendar API, WhatsApp Business API |
| Runtime | Node.js + TypeScript |

## Estrutura de Pastas Raiz

```
clinic/
├── src/
│   ├── app.module.ts          # Módulo raiz — registra todos os módulos e middlewares globais
│   ├── main.ts                # Bootstrap da aplicação NestJS
│   ├── types.d.ts             # Declarações de tipos globais (ex: req.user)
│   ├── config/                # Configuração centralizada via env vars
│   ├── database/              # Configuração TypeORM + migrations
│   ├── middleware/            # Middlewares globais (auth + logger)
│   ├── modules/               # Módulos de domínio (features)
│   ├── utils/                 # Utilitários compartilhados
│   └── whatsapp/              # Integração WhatsApp (separado por ser serviço externo)
├── docker-compose.yml
├── package.json
├── tsconfig.json
└── nest-cli.json
```

## Fluxo de Requisição

```
HTTP Request
    │
    ▼
LoggerMiddleware        ← loga método, URL, tempo de resposta
    │
    ▼
AuthMiddleware          ← valida Bearer token JWT via AuthService.verifyToken()
    │                     injeta req.user com dados do usuário autenticado
    ▼
Controller              ← recebe DTO validado, chama Service
    │
    ▼
Service                 ← lógica de negócio, transações, integrações externas
    │
    ▼
Repository / DataSource ← TypeORM (Repository pattern ou DataSource.transaction())
    │
    ▼
MySQL Database
```

## Rotas Públicas (sem AuthMiddleware)

Configuradas no `AppModule.configure()`:
- `POST /v1/auth/login`
- `GET /health`
- `POST /v1/user`

## Módulos Registrados no AppModule

```
ConfigModule          → variáveis de ambiente
DatabaseModule        → conexão TypeORM com MySQL
HealthModule          → endpoint de health check
AuthModule            → login/logout/verifyToken
UserModule            → CRUD de usuários (médicos/assistentes)
CalendarModule        → integração Google Calendar
ClientsModule         → cadastro de pacientes
WhatsappModule        → envio de mensagens WhatsApp
FeedbackModule        → feedback de tratamento
QuestionsModule       → guia de perguntas de psicanálise
TreatmentModule       → passos do tratamento
PathologiesModule     → cadastro de patologias
MedicalRecordModule   → prontuário central (orquestra os demais)
```

## Padrão de Prefixo de Rotas

Todas as rotas usam o prefixo `v1/`:
- `v1/clients`
- `v1/medical-record`
- `v1/pathologies`
- `v1/questions`
- `v1/treatment`
- `v1/feedback`
- `v1/calendar`
- `v1/whatsapp`
- `v1/auth`
- `v1/user`
