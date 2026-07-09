# Modelos WhatsApp Business

Documentação dos templates aprovados na Meta e dos parâmetros enviados pelo backend (`CalendarReminderService`).

**Idioma:** `pt_BR`  
**Credenciais:** `whatsAppId` e `whatsAppToken` do usuário logado (profissional)  
**Telefone:** apenas dígitos com DDI, sem `+` (ex: `5516999737133`)

---

## `lembrete_agendamento_12h`

**Destinatário:** paciente (`client.telephone`)  
**Quando:** criação do agendamento (opcional) e lembrete automático (~12h antes)

**Objetivo:** lembrar o paciente da consulta e orientá-lo a **confirmar ou cancelar** o agendamento pelo link.

**Corpo sugerido na Meta:**

```
Olá, {{1}}!

Lembramos que você tem consulta com {{2}} em {{3}}.

Por favor, confirme ou cancele seu agendamento acessando o link abaixo:
{{4}}

Aguardamos sua resposta!
```

| Parâmetro | Conteúdo | Origem |
|-----------|----------|--------|
| `{{1}}` | Nome do paciente | `client.name` |
| `{{2}}` | Nome do profissional | `user.name` |
| `{{3}}` | Data/hora formatada | `startDate` (`toLocaleString` pt-BR) |
| `{{4}}` | Link de confirmação/cancelamento | `${FRONTEND_URL}/confirmar-presenca/{token}` |

**Botão URL dinâmica:** `buttonParameters[0].text` = link de confirmação/cancelamento

---

## `confirmar_agendamento`

**Destinatário:** profissional (`user.telephone`)  
**Quando:** paciente confirma presença pelo link, ou `POST /v1/calendar/:id/notify-professional/confirm`

**Cabeçalho (fixo na Meta):** `Agendamento Confirmado`

**Corpo sugerido na Meta:**

```
Olá, Dr(a). {{1}}!

Passando para informar que um novo agendamento foi confirmado na sua agenda:

👤 Paciente: {{2}}
📅 Data: {{3}}
⏰ Horário: {{4}}

O prontuário já está atualizado no sistema.
```

| Parâmetro | Conteúdo | Origem | Exemplo |
|-----------|----------|--------|---------|
| `{{1}}` | Nome do doutor | `user.name` | Paulo |
| `{{2}}` | Nome do paciente | `client.name` | Caio |
| `{{3}}` | Data do agendamento | `startDate` (dia + mês por extenso) | 23 de janeiro |
| `{{4}}` | Intervalo de horário | `startDate` e `endDate` | 19:00 às 19h20 |

**Formato de `{{4}}`:** `{início} às {fim}` — início com `:` (ex: `19:00`), fim com `h` (ex: `19h20`). Fuso: `America/Sao_Paulo`.

---

## `cancelar_agendamento`

**Destinatário:** profissional (`user.telephone`)  
**Quando:** paciente cancela pelo link, ou `POST /v1/calendar/:id/notify-professional/cancel`

**Cabeçalho (fixo na Meta):** `Agendamento Cancelado`

**Corpo sugerido na Meta:**

```
Olá, Dr(a). {{1}}.

Atenção para a atualização na sua agenda:

❌ Cancelado: {{2}}
🗓️ Data: {{3}}
⏰ Horário: {{4}}

O horário já foi liberado no sistema para novos encaixes.
```

| Parâmetro | Conteúdo | Origem | Exemplo |
|-----------|----------|--------|---------|
| `{{1}}` | Nome do doutor | `user.name` | Paulo |
| `{{2}}` | Nome do paciente | `client.name` | Caio |
| `{{3}}` | Data do agendamento | `startDate` (dia + mês por extenso) | 23 de janeiro |
| `{{4}}` | Intervalo de horário | `startDate` e `endDate` | 19:00 às 19h20 |

**Formato de `{{4}}`:** igual ao `confirmar_agendamento`.

---

## Endpoints relacionados

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/v1/whatsapp` | Envio manual de qualquer template |
| `GET` | `/v1/medical-records/:id/whatsapp-reminder-payload` | Payload do lembrete ao paciente |
| `POST` | `/v1/calendar/:id/notify-professional/confirm` | Notifica profissional — confirmação |
| `POST` | `/v1/calendar/:id/notify-professional/cancel` | Notifica profissional — cancelamento |

## Envio automático (fluxo do paciente)

Quando o **cliente** confirma ou cancela pelo link ou API pública, o WhatsApp ao profissional é disparado **em background**. Falhas no envio **não impedem** confirmar/cancelar — apenas geram log (`warn` se dados faltando, `error` se falha na API).

| Evento do paciente | Endpoint | Template enviado ao profissional |
|--------------------|----------|----------------------------------|
| Confirma presença (link) | `POST /v1/calendar/confirmation/:urlSafeToken/confirm` | `confirmar_agendamento` |
| Cancela (link) | `POST /v1/calendar/confirmation/:urlSafeToken/cancel` | `cancelar_agendamento` |
| Confirma (token no body) | `POST /v1/calendar/:medicalRecordId/confirm-attendance` | `confirmar_agendamento` |
| Cancela (token no body) | `POST /v1/calendar/:medicalRecordId/cancel-attendance` | `cancelar_agendamento` |

Implementação: `CalendarService.confirmAttendance` e `CalendarService.cancelAttendance` → `CalendarReminderService.sendProfessionalAppointment*Silently`.

## Envio manual / outros

| Evento | Template |
|--------|----------|
| Criação do agendamento (flag `sendWhatsAppConfirmation`) | `lembrete_agendamento_12h` (ao **paciente**) |
| `POST /v1/calendar/:id/notify-professional/confirm` | `confirmar_agendamento` (erro retorna ao caller) |
| `POST /v1/calendar/:id/notify-professional/cancel` | `cancelar_agendamento` (erro retorna ao caller) |

## Erros comuns

| Código | Causa |
|--------|-------|
| `#131030` | Número fora da lista de permissão (modo teste Meta) |
| `#132000` | Quantidade de parâmetros diferente do template aprovado |

## Referência no código

- Constantes: `src/modules/calendar/services/calendar-reminder.service.ts`
- Montagem dos parâmetros: `buildProfessionalNotificationPayload`, `buildReminderTemplatePayload`
- Lista de nomes: `src/utils/whatsapp-templates.ts` → `WhatsAppBusinessTemplates`
