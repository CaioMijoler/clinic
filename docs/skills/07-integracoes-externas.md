# SKILL: Integrações Externas — WhatsApp

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
      ├── CalendarService          ← CRUD de agendamentos + confirmação
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
@Cron('0 0 * * **/5 * * * *')  // Executa a cada 5 minutos
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

**Enum:** `MedicalRecordStatusEnum` (`src/utils/enum/medical-record.enum.ts`)
```typescript
enum MedicalRecordStatusEnum {
  PENDING = 'PENDING',
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  NO_SHOW = 'NO_SHOW',
  CANCELED = 'CANCELED',
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
3. Atualiza: MedicalRecord.status = CONFIRMED, confirmedAt = new Date()
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
  whatsapp: {
    url: process.env.WHATSAPP_URL,
  },
  database: { /* MySQL config */ },
  cripto: { /* criptografia */ },
};
```

Acesso nos services via `ConfigService.get<string>('whatsapp.url')`.
