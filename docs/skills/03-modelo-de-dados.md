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
| credentials | json | Credenciais Google Service Account para Calendar |
| calendarId | varchar | ID do calendário Google associado ao usuário |
| created_at | timestamp | |
| updated_at | timestamp | |

## Entidade: `clients` (Client — Paciente)

| Coluna | Tipo | Descrição |
|---|---|---|
| id | int PK | Identificador |
| name | varchar(255) | Nome completo |
| document | varchar(20) | CPF (armazenado sem máscara) |
| ie_rg | varchar(20) | RG (armazenado sem máscara) |
| email | varchar(255) | Email |
| telephone | varchar(255) | Telefone (normalizado pelo FormatPhone) |
| created_at | timestamp | |
| updated_at | timestamp | |
| clientAddress | OneToOne | Endereço (cascade: true) |

## Entidade: `client_address` (ClientAddress)

| Coluna | Tipo | Descrição |
|---|---|---|
| id | int PK | |
| zip_code | varchar | CEP (8 chars) |
| street | varchar | Rua |
| number | varchar | Número |
| complement | varchar | Complemento |
| neighborhood | varchar | Bairro |
| city | varchar | Cidade |
| state | varchar(2) | UF |
| client_id | int FK | → clients.id |

## Entidade: `medical_record` (MedicalRecord — Prontuário)

| Coluna | Tipo | Descrição |
|---|---|---|
| id | int PK | |
| calendar_google_id | text | ID do evento no Google Calendar |
| title | varchar(255) | Título do agendamento |
| start_date | timestamp | Data/hora início consulta |
| end_date | timestamp | Data/hora fim consulta |
| symptoms | varchar(255) | Descrição dos sintomas |
| clinical_exam | varchar(255) | Exame clínico (preenchido pelo médico) |
| completed_clinical_exam | varchar(255) | Conclusão do exame clínico |
| conclusion | varchar(255) | Conclusão do prontuário |
| client_id | int FK | → clients.id |
| user_id | int FK | → users.id |
| status | varchar | Enum: CREATED / SCHEDULED / CANCELED / CANCELED_SCHEDULE |
| created_at | timestamp | |
| updated_at | timestamp | |

**Relações:**
- `ManyToOne` → User, Client
- `OneToMany` → Treatment[], Feedback[], MedicalRecordPathologies[], MedicalRecordQuestions[]
- `ManyToMany` → Pathology[] (via `medical_record_pathologies`), Question[] (via `medical_record_questions`)

## Entidade: `pathologies` (Pathology)

| Coluna | Tipo | Descrição |
|---|---|---|
| id | int PK | |
| code | varchar(120) | CID / código da doença |
| description | varchar(255) | Descrição da patologia |
| created_at | timestamp | |
| updated_at | timestamp | |

Relações: `ManyToMany` ↔ MedicalRecord, `OneToMany` → MedicalRecordPathologies

## Entidade: `medical_record_pathologies` (tabela pivô)

| Coluna | Tipo | Descrição |
|---|---|---|
| id | int PK | |
| medical_record_id | int FK | → medical_record.id |
| pathologies_id | int FK | → pathologies.id |

## Entidade: `questions` (Question — Guia de Psicanálise)

| Coluna | Tipo | Descrição |
|---|---|---|
| id | int PK | |
| name | varchar(255) | Texto da pergunta |
| response | varchar(255) | Resposta da pergunta |
| created_at | timestamp | |
| updated_at | timestamp | |

Relações: `ManyToMany` ↔ MedicalRecord, `OneToMany` → MedicalRecordQuestions

## Entidade: `medical_record_questions` (tabela pivô)

| Coluna | Tipo | Descrição |
|---|---|---|
| id | int PK | |
| medical_record_id | int FK | → medical_record.id |
| question_id | int FK | → questions.id |

## Entidade: `treatment` (Treatment — Passos do Tratamento)

| Coluna | Tipo | Descrição |
|---|---|---|
| id | int PK | |
| description | varchar(255) | Descrição do passo de tratamento |
| medical_record_id | int FK | → medical_record.id |
| created_at | timestamp | |
| updated_at | timestamp | |

Relação: `ManyToOne` → MedicalRecord

## Entidade: `feedback` (Feedback)

| Coluna | Tipo | Descrição |
|---|---|---|
| id | int PK | |
| description | varchar(255) | Descrição do feedback do tratamento |
| medical_record_id | int FK | → medical_record.id |
| created_at | timestamp | |
| updated_at | timestamp | |

Relação: `ManyToOne` → MedicalRecord

## Status do Prontuário (MedicalRecordStatusEnum)

```typescript
// src/utils/enum/medical-record.enum.ts
enum MedicalRecordStatusEnum {
  CREATED = 'CREATED',              // Prontuário criado, sem agendamento
  SCHEDULED = 'SCHEDULED',          // Agendamento criado no Google Calendar
  CANCELED = 'CANCELED',            // Prontuário cancelado/removido
  CANCELED_SCHEDULE = 'CANCELED_SCHEDULE', // Agendamento cancelado no Calendar
}
```

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
| 1733775454390 | client-address.ts | Tabela `client_address` |

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
