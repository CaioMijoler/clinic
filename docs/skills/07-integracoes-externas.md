# SKILL: Integrações Externas — Google Calendar e WhatsApp

## Google Calendar

### Configuração

```bash
# Env vars necessárias:
CALENDAR_URL=https://www.googleapis.com/auth/calendar  # scope OAuth
```

O usuário precisa ter configurado no banco  client_email, private_key ambos do tipo texto de **Service Account** do Google:
```json
{
  "client_email": "service-account@projeto.iam.gserviceaccount.com",
  "private_key": "-----BEGIN RSA PRIVATE KEY-----\n..."
}
```

E `users.calendarId` com o ID do calendário Google vinculado ao médico.

### Autenticação Google (JWT Service Account)

```typescript
// CalendarService.googleAuth(user)
const auth = new google.auth.JWT(
  user.client_email,
  null,
  user.private_key,
  SCOPES, // = CALENDAR_URL env
);
this.calendar = google.calendar({ version: 'v3', auth });
```

### Fluxo de Agendamento (CalendarService)

```
POST /v1/calendar
  1. Valida usuário autenticado (busca clientEmail, privateKey e calendarId)
  2. Valida que o Client existe (via clientId)
  3. Valida MedicalRecord se medicalRecordId informado (opcional)
  4. Autentica no Google Calendar via Service Account
  5. Insere evento: calendar.events.insert({ calendarId, resource: calendarDto })
  6. Salva/atualiza MedicalRecord:
     - calendarGoogleId = id do evento Google
     - title, startDate, endDate
     - status = SCHEDULED (default)
  7. Retorna dados do evento criado
```

### Criação de Evento (CreateCalendarDto esperado)

```typescript
// O DTO segue o formato da Google Calendar API + campos extras:
{
  medicalRecordId?: number;              // Opcional — ID do prontuário em andamento
  clientId: number;                      // Obrigatório — ID do paciente
  summary: string;                       // título do evento
  description: string;                   // descrição/observação
  start: {
    dateTime: string;                    // ISO 8601: "2024-10-01T10:00:00-03:00"
    timeZone: string;                    // "America/Sao_Paulo"
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
}
```

### Listagem de Eventos (GET /v1/calendar)

```typescript
// FilterCalendarDto:
{
  start: string;  // timeMin (ISO 8601)
  end: string;    // timeMax (ISO 8601)
}
// Retorna array de eventos do Google Calendar
```

### Cancelamento (DELETE /v1/calendar/:eventId)

```
eventId = calendarGoogleId (ID do evento no Google)
  1. Valida usuário
  2. Busca MedicalRecord por calendarGoogleId
  3. calendar.events.delete(eventId)
  4. Atualiza MedicalRecord.status = CANCELED_SCHEDULE
```

---

## WhatsApp Business API

### Configuração

```bash
# Env vars necessárias:
WHATSAPP_URL=https://graph.facebook.com/v17.0
WHATSAPP_PHONE_NUMBER_ID=seu-phone-number-id
WHATSAPP_ACCESS_TOKEN=seu-access-token
FRONTEND_URL=https://seusistema.com   # usado nos links de confirmação
```

> O `whatsAppId` e `whatsAppToken` também existem na tabela `users`, sugerindo possibilidade de integração por usuário.

### Módulo (`src/whatsapp/`)

O `WhatsappModule` exporta `WhatsappService` para ser reutilizado pelo `CalendarModule`.

### Envio de Mensagem de Texto (WhatsappService.sendMessage)

Para mensagens dentro da janela de 24h (resposta a mensagem do paciente):

```typescript
await whatsappService.sendMessage({
  to: '5516999999999',
  body: 'Texto da mensagem',
});
// Envia type: 'text' → usado para respostas diretas
```

### Envio de Template (WhatsappService.sendTemplateMessage)

Para mensagens **proativas** (fora da janela de 24h) — obrigatório pela API do WhatsApp Business:

```typescript
await whatsappService.sendTemplateMessage({
  to: '5516999999999',
  templateName: 'lembrete_agendamento_12h',
  languageCode: 'pt_BR',
  bodyParameters: ['Nome do Paciente', 'segunda-feira, 5 de maio, 14:00', 'https://link'],
  buttonParameters: [{ index: 0, text: 'https://link' }],
});
// Envia type: 'template' com components de body e button
```

### DTOs do WhatsApp

```typescript
// CreateWhatsappDto (para sendMessage):
{
  to: string;    // número do destinatário (com DDI: "5516999999999")
  body: string;  // texto da mensagem
}
```

### Endpoints WhatsApp

```
POST /whatsapp     → WhatsappController.sendMessage() — envio manual de texto
```

---

## Lembrete Automático de Agendamento (WhatsApp Business) ✅

**Módulo:** `src/modules/calendar/services/calendar-reminder.service.ts`

### Visão Geral

Envio automático de mensagem via WhatsApp Business API para lembrar o paciente **12 horas antes** do atendimento agendado. Inclui link de confirmação de presença com token UUID.

### Arquitetura

```
AppModule
 └── ScheduleModule.forRoot()    ← habilita @Cron
 └── CalendarModule
      ├── CalendarService          ← CRUD de eventos + confirmação
      ├── CalendarReminderService  ← Cron de lembretes
      └── imports: [WhatsappModule]  ← acesso ao WhatsappService
```

### Template de Mensagem (WhatsApp Business)

**Nome do template:** `lembrete_agendamento_12h`
**Idioma:** `pt_BR`

```
Olá, {{1}} 👋

Este é um lembrete do seu atendimento agendado para amanhã às {{2}}.

Por favor, confirme sua presença clicando no link abaixo:
{{3}}

Caso não possa comparecer, nos avise 😊
```

**Variáveis:**
| Variável | Conteúdo | Origem |
|---|---|---|
| `{{1}}` | Nome do paciente | `client.name` |
| `{{2}}` | Data/hora formatada | `medicalRecord.startDate` via `toLocaleString('pt-BR')` |
| `{{3}}` | Link de confirmação | `${FRONTEND_URL}/confirmar-presenca/${id}/${token}` |

### Cron Job (CalendarReminderService)

```typescript
@Cron('*/5 * * * *')  // Executa a cada 5 minutos
async sendReminderMessages() {
  const now = new Date();
  const twelveHoursFromNow = new Date(now.getTime() + 12 * 60 * 60 * 1000);
  const marginMs = 5 * 60 * 1000;  // margem de ±5 min

  const appointments = await this.medicalRecordRepository.find({
    where: {
      status: MedicalRecordStatusEnum.SCHEDULED,
      reminderSentAt: IsNull(),
      startDate: Between(
        new Date(twelveHoursFromNow.getTime() - marginMs),
        new Date(twelveHoursFromNow.getTime() + marginMs),
      ),
    },
    relations: ['client', 'user'],
  });

  for (const appointment of appointments) {
    // 1. Gera confirmationToken (UUID) se não existe
    // 2. Envia template via WhatsApp Business API
    // 3. Marca reminderSentAt = new Date()
  }
}
```

**Detalhes importantes:**
- Filtro de data no **banco** (não em memória) → performance
- Janela precisa de **12h ± 5min** → evita perder agendamentos entre ciclos do cron
- Token de confirmação gerado automaticamente pelo cron se ausente
- Telefone formatado com DDI 55 automaticamente (`phone.length <= 11 ? '55' + phone : phone`)
- Erro em um lembrete **não interrompe** os demais (try/catch individual)

### Confirmação de Presença

**Enum:** `AttendanceStatusEnum` (`src/utils/enum/attendance.enum.ts`)
```typescript
enum AttendanceStatusEnum {
  PENDING = 'PENDING',       // Aguardando confirmação (default)
  CONFIRMED = 'CONFIRMED',   // Presença confirmada pelo paciente
  NO_SHOW = 'NO_SHOW',       // Paciente não compareceu
}
```

**Endpoints:**

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `POST` | `/v1/calendar/:eventId/confirm-attendance` | ❌ Público | Paciente confirma presença via token |
| `GET` | `/v1/calendar/:eventId/confirmation-link` | ✅ Bearer | Gera link de confirmação manualmente |

**Fluxo de confirmação:**
```
1. POST /v1/calendar/:eventId/confirm-attendance { token: "uuid-xxx" }
2. Valida: MedicalRecord.id == eventId AND confirmationToken == token
3. Atualiza: attendanceStatus = CONFIRMED, confirmedAt = new Date()
4. Loga notificação para o profissional (TODO: envio WhatsApp/email)
```

> **Nota:** O endpoint `confirm-attendance` é excluído do `AuthMiddleware` no `AppModule` para acesso público.

### Controle de Envio (campo `reminderSentAt`)

- `reminder_sent_at` (timestamp, nullable) na tabela `medical_record`
- `null` = lembrete não enviado → cron processa
- `timestamp` = lembrete já enviado → cron ignora
- Migration: `1745343600000-add-reminder-sent-at.ts`

### Templates de Texto (`src/utils/whatsapp-templates.ts`)

Mensagens pré-definidas para fallback (envio de texto simples):

| Template | Variáveis |
|---|---|
| `confirmationReminder` | clientName, professionalName, appointmentDate, confirmationLink |
| `confirmationSuccess` | clientName |
| `dayOfAppointment` | clientName, appointmentTime |
| `cancellation` | clientName, reason? |

---

## Configuração Central (`src/config/app.config.ts`)

```typescript
return {
  env: process.env.ENV ?? 'dev',
  port: process.env.PORT ?? 3000,
  calendar: { url: process.env.CALENDAR_URL },
  whatsapp: {
    url: process.env.WHATSAPP_URL,
    id: process.env.WHATSAPP_PHONE_NUMBER_ID,
    token: process.env.WHATSAPP_ACCESS_TOKEN,
  },
  database: { /* MySQL config */ },
  cripto: { /* criptografia */ },
};
```

Acesso nos services via `ConfigService.get<string>('whatsapp.url')`.
