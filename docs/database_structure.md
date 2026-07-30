# Estrutura de Tabelas - Clinic Backend

Este documento descreve as tabelas do banco de dados, seus campos e relacionamentos.

## Tabelas de Domínio

---

### `user`
Armazena os profissionais de saúde e usuários do sistema.

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `int` | Chave primária. |
| `name` | `varchar(255)` | Nome completo. |
| `email` | `varchar(255)` | Email (único). |
| `password` | `varchar(255)` | Senha (hash). |
| `whatsAppId` | `varchar(255)` | ID da conta WhatsApp. |
| `whatsAppToken` | `text` | Token de acesso WhatsApp. |
| `created_at` | `timestamp` | Data de criação. |
| `updated_at` | `timestamp` | Data de atualização. |

---

### `clients`
Armazena as informações dos pacientes.

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `int` | Chave primária. |
| `name` | `varchar(255)` | Nome completo. |
| `document` | `varchar(20)` | CPF/CNPJ. |
| `ie_rg` | `varchar(20)` | Inscrição estadual / RG. |
| `email` | `varchar(255)` | Email. |
| `telephone` | `varchar(255)` | Telefone. |
| `user_id` | `int` (nullable) | Profissional responsável (FK → `users.id`, `ON DELETE SET NULL`). |
| `created_at` | `timestamp` | Data de criação. |
| `updated_at` | `timestamp` | Data de atualização. |

---

### `medical_record`
Armazena as consultas e prontuários médicos.

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `int` | Chave primária. |
| `title` | `varchar(255)` | Título da consulta. |
| `start_date` | `timestamp` | Data/hora de início. |
| `end_date` | `timestamp` | Data/hora de fim. |
| `symptoms` | `text` | Sintomas relatados. |
| `clinical_exam` | `text` | Exame clínico. |
| `completed_clinical_exam` | `text` | Exame clínico completo. |
| `conclusion` | `text` | Conclusão/Diagnóstico. |
| `client_id` | `int` | ID do paciente. |
| `user_id` | `int` | ID do profissional. |
| `status` | `varchar(255)` | Status (created, scheduled, canceled, etc.). |
| `confirmation_token` | `varchar(255)` | Token para confirmação via WhatsApp. |
| `confirmed_at` | `timestamp` | Data da confirmação de presença. |
| `reminder_sent_at` | `timestamp` | Data do último lembrete enviado. |
| `created_at` | `timestamp` | Data de criação. |
| `updated_at` | `timestamp` | Data de atualização. |

---

### `medical_record_documents`
Armazena documentos e anexos vinculados a um prontuário.

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `int` | Chave primária. |
| `medical_record_id` | `int` | ID do prontuário associado (Relacionamento com `medical_record`). |
| `name` | `varchar(255)` | Nome original do arquivo. |
| `path` | `text` | Caminho do arquivo no bucket do Supabase. |
| `content_type` | `varchar(100)` | Tipo MIME do arquivo. |
| `created_at` | `timestamp` | Data de criação. |
| `updated_at` | `timestamp` | Data de atualização. |

---

### `treatment`
Armazena os tratamentos prescritos.

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `int` | Chave primária. |
| `description` | `varchar(255)` | Descrição do tratamento. |
| `medical_record_id` | `int` | ID do prontuário associado. |
| `user_id` | `int` (nullable) | Profissional responsável (FK → `users.id`, `ON DELETE SET NULL`). |
| `created_at` | `timestamp` | Data de criação. |
| `updated_at` | `timestamp` | Data de atualização. |

---

### `feedback`
Armazena o feedback dos pacientes.

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `int` | Chave primária. |
| `rating` | `int` | Avaliação (1-5). |
| `comment` | `text` | Comentário do paciente. |
| `medical_record_id` | `int` | ID do prontuário associado. |
| `created_at` | `timestamp` | Data de criação. |

---

### `questions`
Tabela base para perguntas de anamnese.

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `int` | Chave primária. |
| `name` | `varchar(255)` | Pergunta. |
| `response` | `varchar(500)` | Resposta padrão. |
| `user_id` | `int` (nullable) | Profissional dono do registro (FK → `users.id`, `ON DELETE SET NULL`). |
| `created_at` | `timestamp` | Data de criação. |
| `updated_at` | `timestamp` | Data de atualização. |

---

### `pathologies`
Tabela base para patologias comuns.

| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `int` | Chave primária. |
| `code` | `varchar(120)` | Código (ex.: CID). |
| `description` | `varchar(255)` | Descrição da patologia. |
| `user_id` | `int` (nullable) | Profissional dono do registro (FK → `users.id`, `ON DELETE SET NULL`). |
| `created_at` | `timestamp` | Data de criação. |
| `updated_at` | `timestamp` | Data de atualização. |

---

## Tabelas de Relacionamento (N:N)

### `medical_record_questions`
Associa perguntas de anamnese a um prontuário específico.

### `medical_record_pathologies`
Associa patologias identificadas a um prontuário específico.

---

## Integrações

### `whatsapp`
Configurações e logs da integração com a API do WhatsApp.
