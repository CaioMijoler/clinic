# SKILL: Domínios de Negócio — Escopo do Sistema Clínico

## Visão Geral dos Módulos de Negócio

Este backend implementa um sistema de gestão de clínica médica com os seguintes domínios:

---

## 1. Cadastro de Pacientes (`/v1/clients`)

**Módulo:** `src/modules/clients/`

Gerencia o cadastro de pacientes com endereço vinculado.

### Campos do Paciente
- `name` — Nome completo (varchar 255)
- `document` — CPF armazenado sem máscara (varchar 20)
- `ieRg` — RG armazenado sem máscara (varchar 20)
- `email` — Email único (varchar 255)
- `telephone` — Telefone normalizado sem DDI 55 (varchar 255)
- `clientAddress` — Endereço completo (OneToOne, cascade)

### Campos do Endereço (ClientAddress)
- `zipCode` (8 chars), `street`, `number`, `complement`, `neighborhood`, `city`, `state` (2 chars)

### Unicidade e Upsert
- O `create` valida unicidade por **email** (lança erro se já existe)
- O `MedicalRecordService.createOrUpdateClient()` usa **CPF (document)** para upsert: cria novo se não existe, atualiza se já existe

### CRUD disponível
```
POST   /v1/clients          → criar paciente
GET    /v1/clients          → listar (com FilterDto)
GET    /v1/clients/:id      → buscar por id (com clientAddress)
PUT    /v1/clients/:id      → atualizar (merge endereço + dados)
DELETE /v1/clients/:id      → remover (hard delete)
```

---

## 2. Prontuário do Paciente (`/v1/medical-record`)

**Módulo:** `src/modules/medical-record/`

Módulo central que **orquestra** a criação de cliente, patologias, tratamentos e perguntas em uma única transação.

### Campos do Prontuário
- `symptoms` — Descrição dos sintomas
- `clinicalExam` — Exame clínico inserido pelo médico
- `completeClinicalExam` — Conclusão do exame clínico
- `conclusion` — Conclusão do prontuário
- `status` — `pending` / `in_progress` / `finished` / `canceled` (soft delete)
- `title`, `totalValue` — Metadados do tratamento

### Relações do Prontuário
- `client` → paciente associado (ManyToOne)
- `user` → médico responsável (ManyToOne, via req.user)
- `treatments[]` → passos do tratamento (OneToMany)
- `feedbacks[]` → feedbacks de tratamento (OneToMany)
- `pathologies[]` → patologias associadas (ManyToMany via pivô)
- `questions[]` → perguntas de psicanálise associadas (ManyToMany via pivô)
- `appointments[]` → agendamentos vinculados (OneToMany)

### Cancelamento (soft delete)
`DELETE /v1/medical-record/:id`:
1. Define `medical_record.status = canceled`
2. Cancela agendamentos ativos vinculados (`appointments.status = canceled`, `canceled_by = admin`)
3. Agendamentos cujo **prontuário** está `canceled` **não aparecem** na listagem de calendário (`GET /calendar`). Cancelamentos de agendamento (cliente/admin) **continuam** visíveis no calendário. Prontuários cancelados **continuam** na listagem de prontuário.

### Criação (transacional)
O `create` aceita um único POST com todos os dados aninhados:
```json
{
  "symptoms": "...",
  "clinicalExam": "...",
  "completeClinicalExam": "...",
  "conclusion": "...",
  "client": { /* CreateClientDto */ },
  "medicalRecordPathologies": [{ "pathologiesId": 1 }],
  "medicalRecordQuestions": [{ "questionId": 2 }],
  "treatments": [{ "description": "Passo 1" }, { "description": "Passo 2" }]
}
```

### findOne — Relações carregadas
```typescript
relations: ['feedbacks', 'client', 'medicalRecordQuestions', 'medicalRecordPathologies', 'pathologies', 'questions', 'treatments']
```

### CRUD disponível
```
POST   /v1/medical-record          → criar prontuário (transacional)
GET    /v1/medical-record          → listar (com FilterDto)
GET    /v1/medical-record/:id      → buscar com todas as relações
PUT    /v1/medical-record/:id      → atualizar (transacional)
DELETE /v1/medical-record/:id      → cancelar (status = CANCELED, soft)
```

---

## 3. Agendamento (`/v1/calendar`)

**Módulo:** `src/modules/calendar/`

O agendamento pode ser criado a partir de um `MedicalRecord` existente (via `medicalRecordId` opcional) e vinculado a um paciente (`clientId` obrigatório).

### CreateCalendarDto
```typescript
{
  medicalRecordId?: number;   // Opcional — ID do prontuário em andamento
  clientId: number;           // Obrigatório — ID do paciente
  summary: string;            // Título do evento
  description: string;        // Descrição
  start: { dateTime, timeZone };
  end: { dateTime, timeZone };
}
```

### Endpoints
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `POST` | `/v1/calendar` | ✅ Bearer | Criar agendamento (`appointments`) + serviços; status inicial `created` |
| `GET` | `/v1/calendar` | ✅ Bearer | Listar eventos por período (inclui cancelados; omite só se o prontuário estiver `canceled`) |
| `DELETE` | `/v1/calendar/:id` | ✅ Bearer | Cancelar/excluir agendamento conforme status |
| `POST` | `/v1/calendar/:id/confirm-presence` | ✅ Bearer | Profissional confirma presença (status → `confirmed_schedule`) |
| `POST` | `/v1/calendar/:id/mark-attendance` | ✅ Bearer | Registrar comparecimento no dia (`attended`) |
| `POST` | `/v1/calendar/:appointmentId/confirm-attendance` | ❌ Público | Paciente confirma presença via token |
| `POST` | `/v1/calendar/:appointmentId/cancel-attendance` | ❌ Público | Paciente cancela via token |
| `GET` | `/v1/calendar/confirmation/:urlSafeToken` | ❌ Público | Preview do link de confirmação |

### Comparecimento no dia (`mark-attendance`)

Disponível apenas quando o status do agendamento é `confirmed_schedule` ou `in_progress`.

| Ação do profissional | Body | Efeito |
|---|---|---|
| **Compareceu** | `{ "attended": true }` | Mantém o status atual; `attended = true`. O fluxo do atendimento segue normalmente. |
| **Faltou** | `{ "attended": false }` | `attended = false`, cancela o agendamento (`status = canceled_schedule`, `canceled_by = admin`). Conta como falta nas sessões realizadas. |

Campo `appointments.attended` (nullable):
- `null` — ainda não informado
- `true` — compareceu
- `false` — faltou (agendamento cancelado)

Campo `appointments.canceled_by` (nullable):
- `client` — paciente cancelou pelo link
- `admin` — profissional/admin cancelou (calendário, falta ou soft-delete do prontuário)
- `null` — não cancelado

### Services
- **`CalendarService`** — CRUD de agendamentos + confirmação de presença + comparecimento no dia
- **`CalendarReminderService`** — Cron job que envia lembretes WhatsApp 12h antes do atendimento (a cada 5 min)

---

## 4. Cadastro de Patologias (`/v1/pathologies`)

**Módulo:** `src/modules/pathologies/`

```
Campos: code (CID), description
CRUD completo
```

Patologias são entidades master vinculadas ao prontuário via tabela pivô `medical_record_pathologies`.
O prontuário pode ter **até 2 patologias** (regra de negócio a ser validada na camada de service).

---

## 5. Guia de Perguntas de Psicanálise (`/v1/questions`)

**Módulo:** `src/modules/questions/`

```
Campos: name (pergunta), response (resposta)
CRUD completo
```

Banco de perguntas pré-cadastradas vinculadas ao prontuário via tabela pivô `medical_record_questions`.

---

## 6. Passos de Tratamento (`/v1/treatment`)

**Módulo:** `src/modules/treatment/`

```
Campos: description, medicalRecordId
CRUD completo
```

Múltiplos passos de tratamento por prontuário (1:N). Criados dentro da transação do prontuário.

---

## 7. Feedback do Tratamento (`/v1/feedback`)

**Módulo:** `src/modules/feedback/`

```
Campos: description, medicalRecordId
CRUD completo
```

Feedbacks dos pacientes sobre o tratamento, vinculados ao prontuário.

---

## 8. Mensagens WhatsApp (`/v1/whatsapp`)

**Módulo:** `src/whatsapp/`

- Cadastro de mensagens pré-definidas (entidade própria)
- Envio via WhatsApp Business API

---

## 9. Usuários (`/v1/user`)

**Módulo:** `src/modules/user/`

Cadastro de médicos e assistentes do sistema.

---

## 10. Autenticação (`/v1/auth`)

**Módulo:** `src/modules/auth/`

```
POST /v1/auth/login   → autenticar
POST /v1/auth/logout  → encerrar sessão
```

---

## Mapeamento Escopo → Módulo

| Funcionalidade do Escopo | Módulo | Status |
|---|---|---|
| Agendamento do Paciente | `calendar` | ✅ Implementado |
| Cadastro do Paciente | `clients` | ✅ Implementado |
| Prontuário | `medical-record` | ✅ Implementado |
| Exame Clínico | `medical-record` (campos) | ✅ Implementado |
| Passo a passo do tratamento | `treatment` | ✅ Implementado |
| Feedback do tratamento | `feedback` | ✅ Implementado |
| Guia de Perguntas (psicanálise) | `questions` | ✅ Implementado |
| Cadastro de Patologias | `pathologies` | ✅ Implementado |
| Mensagens WhatsApp | `whatsapp` | ✅ Implementado |
| Arquivos do paciente (upload) | — | ❌ Não implementado ainda |
| Envio automático pós-prontuário | — | ❌ Não implementado ainda |
| Lembrete automático de agendamento (WhatsApp 12h) | `calendar` (CalendarReminderService) | ✅ Implementado |
| Confirmação de presença do paciente | `calendar` (confirmAttendance) | ✅ Implementado |
| Comparecimento no dia (compareceu / faltou) | `calendar` (markAttendance) | ✅ Implementado |
