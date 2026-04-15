# SKILL: Integrações Externas — Google Calendar e WhatsApp

## Google Calendar

### Configuração

```bash
# Env vars necessárias:
CALENDAR_URL=https://www.googleapis.com/auth/calendar  # scope OAuth
```

O usuário precisa ter configurado no banco (`users.credentials`) um JSON de **Service Account** do Google:
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
  credentials.client_email,
  null,
  credentials.private_key,
  SCOPES, // = CALENDAR_URL env
);
this.calendar = google.calendar({ version: 'v3', auth });
```

### Fluxo de Agendamento (CalendarService)

```
POST /v1/calendar
  1. Valida usuário autenticado (busca credentials + calendarId)
  2. Valida que o MedicalRecord existe
  3. Autentica no Google Calendar via Service Account
  4. Insere evento: calendar.events.insert({ calendarId, resource: calendarDto })
  5. Atualiza MedicalRecord:
     - calendarGoogleId = id do evento Google
     - title, startDate, endDate
     - status = SCHEDULED
  6. Retorna dados do evento criado
```

### Criação de Evento (CreateCalendarDto esperado)

```typescript
// O DTO segue o formato da Google Calendar API:
{
  medicalRecordId: number;    // ID do prontuário a vincular
  summary: string;            // título do evento
  description: string;        // descrição/observação
  start: {
    dateTime: string;         // ISO 8601: "2024-10-01T10:00:00-03:00"
    timeZone: string;         // "America/Sao_Paulo"
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
```

> O `whatsAppId` e `whatsAppToken` também existem na tabela `users`, sugerindo possibilidade de integração por usuário.

### Envio de Mensagem (WhatsappService.sendMessage)

```typescript
const payload = {
  messaging_product: 'whatsapp',
  to: dto.to,           // número destino: "5516999999999"
  type: 'text',
  text: { body: dto.body },
};

POST ${WHATSAPP_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages
Authorization: Bearer ${WHATSAPP_ACCESS_TOKEN}
```

### DTOs do WhatsApp

```typescript
// CreateWhatsappDto:
{
  to: string;    // número do destinatário (com código do país: "5516999999999")
  body: string;  // texto da mensagem
}
```

### Endpoint WhatsApp

```
POST /v1/whatsapp     → WhatsappController.sendMessage()
GET  /v1/whatsapp     → listagem de mensagens cadastradas (entidade)
```

> **Escopo futuro**: integração do envio automático pós-finalização de prontuário para solicitação de avaliação no Google.

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
