# 🏥 Clinic Backend — Sistema de Gestão Clínica

Backend do sistema de gestão para clínica médica, desenvolvido em **NestJS + TypeORM + MySQL**.
Gerencia o ciclo completo do paciente: cadastro, prontuário, agendamento, tratamento e comunicação via WhatsApp.

---

## 📋 Funcionalidades

| Módulo | Descrição |
|---|---|
| **Pacientes** | Cadastro completo com endereço, CPF, RG, email e telefone |
| **Prontuário** | Registro de sintomas, exame clínico, patologias, tratamento e conclusão |
| **Agendamento** | Integração com **Google Calendar** para agendamento de consultas |
| **Patologias** | Cadastro de CIDs para vinculação ao prontuário |
| **Tratamento** | Passo a passo do tratamento associado ao prontuário |
| **Feedback** | Coleta de feedback do paciente sobre o tratamento |
| **Perguntas (Psicanálise)** | Guia de perguntas pré-cadastradas vinculadas ao prontuário |
| **WhatsApp** | Envio de mensagens via **WhatsApp Business API** |
| **Autenticação** | Login/logout com JWT (sessão única por usuário) |

---

## 🛠️ Stack Tecnológica

- **Framework:** NestJS v10
- **ORM:** TypeORM v0.3
- **Banco de Dados:** MySQL
- **Autenticação:** JWT (`@nestjs/jwt`)
- **Documentação API:** Swagger (`@nestjs/swagger`)
- **Validação:** `class-validator` + `class-transformer`
- **Integrações:** Google Calendar API, WhatsApp Business API
- **Linguagem:** TypeScript

---

## 🚀 Configuração e Instalação

### Pré-requisitos

- Node.js >= 18
- Docker e Docker Compose
- Yarn

### 1. Clonar o repositório

```bash
git clone https://gitlab.com/caio.mijoler/project-paulo.git
cd project-paulo
```

### 2. Configurar variáveis de ambiente

```bash
cp ".env example" .env
```

Edite o `.env` com os valores do seu ambiente:

```env
# Aplicação
PORT=3000
ENV=dev
LOG_LEVEL=debug

# Banco de dados MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=clinic
DB_USER=root
DB_PASSWORD=sua-senha

# Google Calendar (Service Account)
CALENDAR_URL=https://www.googleapis.com/auth/calendar

# WhatsApp Business API
WHATSAPP_URL=https://graph.facebook.com/v17.0
WHATSAPP_PHONE_NUMBER_ID=seu-phone-number-id
WHATSAPP_ACCESS_TOKEN=seu-access-token

# Criptografia de senha
CRIPTO_ALG=aes-256-cbc
ENCRYPT_SECRET_KEY=sua-chave-secreta
ENCRYPT_IV=seu-iv
```

### 3. Subir o banco de dados

```bash
docker-compose up -d
```

### 4. Instalar dependências

```bash
yarn install
```

### 5. Rodar as migrations

```bash
npm run migrations:run
```

### 6. Iniciar o servidor

```bash
# Desenvolvimento (com hot reload)
yarn dev

# Produção
yarn start:prod
```

A API estará disponível em `http://localhost:3000`.
Documentação Swagger em `http://localhost:3000/api`.

---

## 📦 Estrutura do Projeto

```
src/
├── app.module.ts           # Módulo raiz
├── main.ts                 # Bootstrap da aplicação
├── config/                 # Configuração centralizada via env vars
├── database/               # Configuração TypeORM + migrations
├── middleware/             # Auth middleware (JWT) + Logger middleware
├── utils/                  # Utilitários: filtros, paginação, validação
├── whatsapp/               # Integração WhatsApp Business API
└── modules/
    ├── auth/               # Login / Logout / Verify token
    ├── user/               # Cadastro de usuários (médicos/assistentes)
    ├── clients/            # Cadastro de pacientes
    ├── medical-record/     # Prontuário (módulo central)
    ├── calendar/           # Agendamento via Google Calendar
    ├── pathologies/        # Cadastro de patologias (CID)
    ├── questions/          # Guia de perguntas de psicanálise
    ├── treatment/          # Passos do tratamento
    ├── feedback/           # Feedback do tratamento
    └── health/             # Health check endpoint
```

Cada módulo segue a estrutura padrão NestJS:
```
<modulo>/
├── <modulo>.module.ts
├── <modulo>.controller.ts
├── <modulo>.service.ts
├── dto/
│   ├── create-<modulo>.dto.ts
│   └── update-<modulo>.dto.ts
└── entities/
    └── <modulo>.entity.ts
```

---

## 🔐 Autenticação

Todas as rotas são protegidas por JWT, **exceto**:

| Rota | Método | Descrição |
|---|---|---|
| `/v1/auth/login` | POST | Login com email e senha |
| `/v1/user` | POST | Criação de novo usuário |
| `/health` | GET | Health check |

**Uso do token:**
```
Authorization: Bearer <token-retornado-no-login>
```

---

## 🗃️ Migrations

```bash
# Rodar todas as migrations pendentes
npm run migrations:run

# Reverter a última migration
npm run migrations:revert

# Criar uma nova migration
npm run migration:create -- NomeDaMigration

# Ver status das migrations
npm run migration:show
```

---

## 📡 Endpoints Principais

| Rota | Método | Descrição |
|---|---|---|
| `/v1/auth/login` | POST | Autenticação |
| `/v1/clients` | GET / POST | Listar / Criar pacientes |
| `/v1/clients/:id` | GET / PUT / DELETE | Gerenciar paciente |
| `/v1/medical-record` | GET / POST | Listar / Criar prontuários |
| `/v1/medical-record/:id` | GET / PUT / DELETE | Gerenciar prontuário |
| `/v1/calendar` | GET / POST / DELETE | Gerenciar agendamentos |
| `/v1/pathologies` | GET / POST | Listar / Criar patologias |
| `/v1/questions` | GET / POST | Listar / Criar perguntas |
| `/v1/treatment` | GET / POST | Listar / Criar tratamentos |
| `/v1/feedback` | GET / POST | Listar / Criar feedbacks |
| `/v1/whatsapp` | POST | Enviar mensagem WhatsApp |
| `/health` | GET | Status da aplicação |

Para detalhes completos de request/response, acesse o **Swagger**: `http://localhost:3000/api`

---

## 🔍 Filtros e Paginação

Todos os endpoints de listagem suportam query params para filtragem dinâmica:

```
GET /v1/clients?paginate=true&current_page=1&per_page=10&search=João&search_fields=name,document&relations=clientAddress&sort[createdAt]=desc
```

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `paginate` | boolean | Ativa paginação |
| `current_page` | number | Página atual (padrão: 1) |
| `per_page` | number | Itens por página (padrão: 10) |
| `filter[campo]` | string | Filtro exato por campo: status, datas, IDs |
| `search` | string | Busca livre OR LIKE. **Usar com `search_fields`** |
| `search_fields` | string (CSV) | Campos onde o `search` é aplicado: `name,document` |
| `relations` | string (CSV) | Relations para carregar: `client,treatments` |
| `fields` | string (CSV) | Campos a retornar: `id,name,email` |
| `sort[campo]` | asc\|desc | Ordenação |

### `filter` vs `search`

| Situação | Usar | Exemplo |
|---|---|---|
| Valor exato / Status / Datas | `filter` | `filter[status]=CREATED` |
| Busca livre em **um** campo | `filter` | `filter[name]=João` |
| Busca livre em **múltiplos** campos (OR) | `search` + `search_fields` | `search=João&search_fields=name,document` |

**Exemplos por módulo:**
```
# Pacientes — busca por nome OU CPF
GET /v1/clients?search=João&search_fields=name,document

# Patologias — busca por código OU descrição
GET /v1/pathologies?search=J00&search_fields=code,description

# Prontuários SCHEDULED buscando por sintoma ou conclusão
GET /v1/medical-record?filter[status]=SCHEDULED&search=dor&search_fields=symptoms,conclusion
```

---

## 📄 Documentação Adicional

A documentação de arquitetura detalhada está em [`docs/skills/`](./docs/skills/):

| Documento | Conteúdo |
|---|---|
| [01 - Visão Geral](./docs/skills/01-visao-geral-arquitetura.md) | Stack, estrutura, fluxo de requisição |
| [02 - Estrutura de Módulos](./docs/skills/02-estrutura-modulos.md) | Padrões de Module/Controller/Service |
| [03 - Modelo de Dados](./docs/skills/03-modelo-de-dados.md) | Entidades, colunas, relacionamentos |
| [04 - Validação de DTOs](./docs/skills/04-validacao-dtos.md) | ErrorMessages, class-validator, transforms |
| [05 - Filtro e Paginação](./docs/skills/05-filtro-e-paginacao.md) | FilterDto, IPaginate, filter handlers |
| [06 - Autenticação](./docs/skills/06-autenticacao.md) | Fluxo JWT, middleware, req.user |
| [07 - Integrações Externas](./docs/skills/07-integracoes-externas.md) | Google Calendar, WhatsApp API |
| [08 - Domínios de Negócio](./docs/skills/08-dominios-negocio.md) | Escopo completo por módulo |
| [09 - Guia Novo Módulo](./docs/skills/09-guia-novo-modulo.md) | Checklist para criar um novo módulo |

---

## 👥 Autores

- **Caio Mijoler** — Desenvolvimento
