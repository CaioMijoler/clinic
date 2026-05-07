# 🏥 Clinic Backend — Enterprise Clinical Management System

[![NestJS](https://img.shields.io/badge/framework-NestJS%20v10-E0234E?logo=nestjs)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/language-TypeScript-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![TypeORM](https://img.shields.io/badge/orm-TypeORM%20v0.3-fcad03)](https://typeorm.io/)
[![Database](https://img.shields.io/badge/database-PostgreSQL%20/%20MySQL-336791?logo=postgresql)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

Backend robusto e escalável para gestão de clínicas médicas, estruturado seguindo os princípios de **Clean Architecture** e **Modular Design**. Gerencia desde o fluxo de pacientes e prontuários até integrações complexas com Google Calendar e WhatsApp Business API.

---
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

## 🏛️ Arquitetura e Design Patterns

O projeto foi concebido como um **Monólito Modular**, priorizando baixo acoplamento e alta coesão entre os domínios de negócio.

### Key Patterns:
- **Repository Pattern:** Abstração da camada de persistência para facilitar testes e troca de provedores de dados.
- **DTO (Data Transfer Objects):** Rigoroso controle de entrada e saída de dados com validação via `class-validator`.
- **Dependency Injection:** Utilização extensiva do DI do NestJS para gerenciamento de ciclo de vida e inversão de controle.
- **Middleware-Based Auth:** Pipeline de autenticação centralizado com injeção de contexto de usuário.
- **Dynamic Filtering & Pagination:** Sistema genérico de filtros dinâmicos e paginação via query parameters.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologias |
| :--- | :--- |
| **Core Framework** | [NestJS v10](https://nestjs.com/) |
| **Linguagem** | [TypeScript](https://www.typescriptlang.org/) |
| **Persistência** | [TypeORM v0.3](https://typeorm.io/) + PostgreSQL/MySQL |
| **Cache & Queue** | [Redis](https://redis.io/) (via `ioredis`) |
| **Auth** | JWT (JSON Web Tokens) + Supabase Auth |
| **API Doc** | [Swagger / OpenAPI 3.0](https://swagger.io/) |
| **Storage** | Supabase Storage (S3 compatible) |
| **Mensageria** | WhatsApp Business API (Meta Graph API) |

---

## 🚀 Guia de Inicialização Rápida

### 1. Ambiente Local Completo com Docker
Para rodar a API e todas as dependências (Postgres + Redis) em um único comando:

```bash
docker-compose up -d --build
```

> [!NOTE]
> A API estará acessível em `http://localhost:3001` e o Swagger em `http://localhost:3001/api`.
> Os logs podem ser acompanhados via `docker-compose logs -f api`.

### 2. Configuração de Variáveis (ConfigService)
O sistema utiliza o `ConfigService` do NestJS para gerenciamento centralizado.
```bash
cp ".env example" .env
```
> [!IMPORTANT]
> Certifique-se de configurar corretamente o `REDIS_PORT` e `DB_PORT` para que o cast para `number` no `ConfigService` funcione como esperado.

### 3. Instalação e Execução Manual (Sem Docker para API)
Se desejar rodar apenas as dependências no Docker e a API localmente:
```bash
# Sobe apenas Postgres e Redis
docker-compose up -d db redis

# Instala e roda a API
yarn install
yarn dev
```
A API estará disponível em `http://localhost:3001` (conforme definido no `.env`).
Acesse o Swagger em: `http://localhost:3001/api`

---

## 📂 Estrutura de Domínios (Screaming Architecture)

```text
src/
├── cache/            # Abstração de caching (Redis)
├── config/           # Configurações tipadas (AppConfig, DatabaseConfig)
├── database/         # Migrations e Data Source
├── middleware/       # Guards, Interceptors e Middlewares globais
├── modules/          # Domínios de Negócio (Bounded Contexts)
│   ├── auth/         # Autenticação e Autorização
│   ├── clients/      # Gestão de Pacientes
│   ├── medical-record/# Prontuário (Orquestrador de Domínio)
│   └── ...           # Outros subdomínios (calendar, pathologies, etc)
└── whatsapp/         # Adaptador para integração externa
```

---

## 🔍 Fluxos de Dados e Padrões de API

### 1. Sistema de Paginação e Filtros
Todos os recursos de listagem suportam um motor de busca avançado:
`GET /v1/clients?paginate=true&current_page=1&per_page=10&search=João&search_fields=name,document`

| Parâmetro | Função |
| :--- | :--- |
| `filter[field]` | Filtro de igualdade exata. |
| `search` | Termo para busca textual parcial (LIKE). |
| `search_fields` | Campos onde a busca `search` será aplicada (OR). |
| `relations` | Eager loading de relacionamentos (Comma-separated). |

### 2. Ciclo de Vida da Configuração
As configurações são carregadas via `app.config.ts` e acessadas via `ConfigService`:
```typescript
// Exemplo de uso sênior no RedisService
constructor(private readonly configService: ConfigService) {
  const port = this.configService.get<number>('redis.port'); // Type-safe casting
}
```

---

## 🧪 Estratégia de Testes

Priorizamos testes de integração para fluxos críticos de negócio e testes unitários para lógica complexa.

```bash
# Executar todos os testes
yarn test

# Watch mode para TDD
yarn test:watch

# Relatório de Cobertura
yarn test:cov
```

---

## 📈 Roadmap & Scalability
- [ ] Implementação de **Background Jobs** com BullMQ para envio de mensagens WhatsApp.
- [ ] Migração para **PostgreSQL Vector** para busca semântica em prontuários.
- [ ] Implementação de **Soft Deletes** global em todas as entidades.
- [ ] Suporte a **Multi-tenancy** para múltiplas clínicas.

---

## 👥 Contribuição
1. Crie uma branch para sua feature (`git checkout -b feature/nome-da-feature`)
2. Realize o commit seguindo o padrão **Conventional Commits**
3. Abra um Pull Request para revisão

---
**Desenvolvido com ❤️ por Caio Mijoler**
