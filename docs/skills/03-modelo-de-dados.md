# SKILL: Modelo de Dados — Entidades e Relacionamentos

## Diagrama Conceitual de Relacionamentos

```
User (médico/assistente)
 │
 ├──< MedicalRecord >── Client (paciente)
 │         │
 │         ├──< Treatment[]          (passos do tratamento, 1:N)
 │         ├──< Feedback[]           (feedback do tratamento, 1:N)
 │         ├──< MedicalRecordPathologies >── Pathology  (pivô N:M)
 │         └──< MedicalRecordQuestions   >── Question   (pivô N:M)
 │
Client
 └── ClientAddress (endereço, 1:1 cascade)
```

## Entidade: `users` (User)

| Coluna | Tipo | Descrição |
|---|---|---|
| id | int PK | Identificador |
| name | varchar | Nome do médico/assistente |
| email | varchar | Email (usado no login) |
| password | varchar | Senha criptografada (cripto lib) |
| token | varchar | JWT token atual (invalidado no logout) |
| whatsAppId | varchar | ID do dispositivo WhatsApp vinculado |
| whatsAppToken | varchar | Token de acesso WhatsApp |
| created_at | timestamp | |
| updated_at | timestamp | |

## Entidade: `clients` (Client — Paciente)

| Coluna        | Tipo         | Descrição                               |
| ------------- | ------------ | --------------------------------------- |
| id            | int PK       | Identificador                           |
| name          | varchar(255) | Nome completo                           |
| document      | varchar(20)  | CPF (armazenado sem máscara)            |
| ie_rg         | varchar(20)  | RG (armazenado sem máscara)             |
| email         | varchar(255) | Email                                   |
| telephone     | varchar(255) | Telefone (normalizado pelo FormatPhone) |
| created_at    | timestamp    |                                         |
| updated_at    | timestamp    |                                         |
| clientAddress | OneToOne     | Endereço (cascade: true)                |

## Entidade: `client_address` (ClientAddress)

| Coluna       | Tipo       | Descrição     |
| ------------ | ---------- | ------------- |
| id           | int PK     |               |
| zip_code     | varchar    | CEP (8 chars) |
| street       | varchar    | Rua           |
| number       | varchar    | Número        |
| complement   | varchar    | Complemento   |
| neighborhood | varchar    | Bairro        |
| city         | varchar    | Cidade        |
| state        | varchar(2) | UF            |
| client_id    | int FK     | → clients.id  |

## Entidade: `medical_record` (MedicalRecord — Prontuário)

| Coluna | Tipo | Descrição |
|---|---|---|
| id | int PK | |
| title | varchar(255) | Título do agendamento |
| start_date | timestamp | Data/hora início consulta |
| end_date | timestamp | Data/hora fim consulta |
| symptoms | text | Descrição dos sintomas (máx 900 chars) |
| clinical_exam | text | Exame clínico (preenchido pelo médico) (máx 900 chars) |
| completed_clinical_exam | text | Conclusão do exame clínico (máx 900 chars) |
| conclusion | text | Conclusão do prontuário (máx 900 chars) |
| client_id | int FK | → clients.id |
| user_id | int FK | → users.id |
| status | varchar | Enum: CREATED / SCHEDULED / CANCELED / CANCELED_SCHEDULE / CONFIRMED_SCHEDULE / IN_PROGRESS / CONCLUDED |
| confirmation_token | varchar(255) | Token UUID para link de confirmação de presença (nullable) |
| confirmed_at | timestamp | Data/hora da confirmação de presença (nullable) |
| reminder_sent_at | timestamp | Data/hora do envio do lembrete WhatsApp (nullable) |
| created_at | timestamp | |
| updated_at | timestamp | |

**Relações:**

- `ManyToOne` → User, Client
- `OneToMany` → Treatment[], Feedback[], MedicalRecordPathologies[], MedicalRecordQuestions[]
- `ManyToMany` → Pathology[] (via `medical_record_pathologies`), Question[] (via `medical_record_questions`)

## Entidade: `pathologies` (Pathology)

| Coluna      | Tipo         | Descrição              |
| ----------- | ------------ | ---------------------- |
| id          | int PK       |                        |
| code        | varchar(120) | CID / código da doença |
| description | varchar(255) | Descrição da patologia |
| created_at  | timestamp    |                        |
| updated_at  | timestamp    |                        |

Relações: `ManyToMany` ↔ MedicalRecord, `OneToMany` → MedicalRecordPathologies

## Entidade: `medical_record_pathologies` (tabela pivô)

| Coluna            | Tipo   | Descrição           |
| ----------------- | ------ | ------------------- |
| id                | int PK |                     |
| medical_record_id | int FK | → medical_record.id |
| pathologies_id    | int FK | → pathologies.id    |

## Entidade: `questions` (Question — Guia de Psicanálise)

| Coluna     | Tipo         | Descrição            |
| ---------- | ------------ | -------------------- |
| id         | int PK       |                      |
| name       | varchar(255) | Texto da pergunta    |
| response   | varchar(500) | Resposta da pergunta |
| created_at | timestamp    |                      |
| updated_at | timestamp    |                      |

Relações: `ManyToMany` ↔ MedicalRecord, `OneToMany` → MedicalRecordQuestions

## Entidade: `medical_record_questions` (tabela pivô)

| Coluna            | Tipo   | Descrição           |
| ----------------- | ------ | ------------------- |
| id                | int PK |                     |
| medical_record_id | int FK | → medical_record.id |
| question_id       | int FK | → questions.id      |

## Entidade: `treatment` (Treatment — Passos do Tratamento)

| Coluna            | Tipo         | Descrição                        |
| ----------------- | ------------ | -------------------------------- |
| id                | int PK       |                                  |
| description       | varchar(255) | Descrição do passo de tratamento |
| medical_record_id | int FK       | → medical_record.id              |
| created_at        | timestamp    |                                  |
| updated_at        | timestamp    |                                  |

Relação: `ManyToOne` → MedicalRecord

## Entidade: `feedback` (Feedback)

| Coluna            | Tipo         | Descrição                           |
| ----------------- | ------------ | ----------------------------------- |
| id                | int PK       |                                     |
| description       | varchar(255) | Descrição do feedback do tratamento |
| medical_record_id | int FK       | → medical_record.id                 |
| created_at        | timestamp    |                                     |
| updated_at        | timestamp    |                                     |

Relação: `ManyToOne` → MedicalRecord

## Entidade: `appointments` (Appointment — Agendamento)

Agendamentos ficam na tabela `appointments`, separados do prontuário (`medical_record`).

| Coluna | Tipo | Descrição |
|---|---|---|
| id | int PK | |
| medical_record_id | int FK | → medical_record.id |
| user_id | int FK | → users.id |
| start_date | timestamp | Início da consulta |
| end_date | timestamp | Fim da consulta |
| status | varchar | Enum de agendamento (ver abaixo) |
| quantity_sessions | int | Soma das sessões dos serviços deste agendamento (default 1) |
| attended | boolean nullable | Comparecimento no dia: `null` não informado, `true` compareceu, `false` faltou (cancela) |
| canceled_by | varchar(50) nullable | Quem cancelou: `client` (paciente) ou `admin` (profissional). `null` se não cancelado |
| title | varchar(255) | Título |
| total_value | decimal | Valor total do agendamento |
| confirmation_token | varchar(255) | Token de confirmação WhatsApp |
| confirmed_at | timestamp | Quando o paciente confirmou presença |
| reminder_sent_at | timestamp | Quando o lembrete foi enviado |
| created_at / updated_at | timestamp | |

### Status do agendamento (`AppointmentStatusEnum`)

```typescript
// src/utils/enum/appointment-status.enum.ts
enum AppointmentStatusEnum {
  CREATED = 'created',
  SCHEDULED = 'scheduled',
  CONFIRMED_SCHEDULE = 'confirmed_schedule', // Paciente/profissional confirmou presença
  IN_PROGRESS = 'in_progress',
  CONCLUDED = 'concluded',
  CANCELED = 'canceled',
  CANCELED_SCHEDULE = 'canceled_schedule', // Cancelado (inclui falta no dia)
}
```

### Fluxo de comparecimento (`attended`)

1. Agendamento em `confirmed_schedule` ou `in_progress`.
2. Profissional registra no calendário:
   - **Compareceu** → `attended = true`, status inalterado.
   - **Faltou** → `attended = false`, `status = canceled_schedule` e `canceled_by = admin`.

### Quem cancelou (`canceled_by`)

| Valor | Origem |
|---|---|
| `client` | Paciente cancelou pelo link de confirmação |
| `admin` | Profissional cancelou no calendário, registrou falta, ou soft-delete do prontuário |
| `null` | Agendamento não cancelado |

Agendamentos cancelados **aparecem** no calendário (com status e `canceled_by`). Só ficam ocultos quando o **prontuário** vinculado está `canceled`.

Sessões realizadas do tratamento contam apenas agendamentos com `attended = true`.

## Entidade: `medical_record_services`

| Coluna | Tipo | Descrição |
|---|---|---|
| quantity_sessions | int | Quantidade de sessões **deste serviço** (default 1) |

---

## Status do Prontuário (MedicalRecordStatusEnum)

```typescript
// src/utils/enum/medical-record.enum.ts
enum MedicalRecordStatusEnum {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  FINISHED = 'finished',
  CANCELED = 'canceled', // Soft delete — continua na listagem de prontuários; oculta agendamentos no calendário
}
```

| Status | Significado |
|---|---|
| `pending` | Prontuário criado, tratamento ainda não iniciado |
| `in_progress` | Tratamento em andamento |
| `finished` | Tratamento finalizado |
| `canceled` | Prontuário cancelado (DELETE soft). Continua na listagem de prontuários; **não** aparece na listagem de agendamentos |

`DELETE /v1/medical-record/:id` define `status = canceled` e cancela agendamentos ativos vinculados (`appointments.status = canceled`).

## Migrations Existentes (ordem cronológica)

| Timestamp | Arquivo | Cria/Altera |
|---|---|---|
| 1714602960508 | users.ts | Tabela `users` |
| 1714602978514 | clients.ts | Tabela `clients` |
| 1728170882520 | medical-record.ts | Tabela `medical_record` |
| 1728171159644 | pathologies.ts | Tabela `pathologies` |
| 1728171322002 | treatment.ts | Tabela `treatment` |
| 1728180646238 | questions.ts | Tabela `questions` |
| 1728763238534 | feedback.ts | Tabela `feedback` |
| 1728764877475 | medical-record-pathologies.ts | Tabela pivô |
| 1728764903649 | medical-record-questions.ts | Tabela pivô |
| 1733775454390 | client-address.ts | Tabela `client_address` |`confirmation_token`, `confirmed_at` em `medical_record` |
| 1745343600000 | add-reminder-sent-at.ts | Coluna `reminder_sent_at` em `medical_record` |

## Comandos de Migration

```bash
# Rodar todas as migrations pendentes
npm run migrations:run

# Reverter a última migration
npm run migrations:revert

# Criar nova migration (rodar dentro de src/database/migrations/)
npm run migration:create -- NomeDaMigration

# Ver status das migrations
npm run migration:show
```
