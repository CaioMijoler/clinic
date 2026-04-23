/**
 * Templates de mensagens para WhatsApp
 * Edite aqui as mensagens que serão enviadas aos clientes
 */

export const WhatsAppTemplates = {
  /**
   * Mensagem de confirmação de presença (12h antes da consulta)
   * Variáveis disponíveis:
   * - {clientName}: Nome do cliente
   * - {professionalName}: Nome do profissional
   * - {appointmentDate}: Data/hora da consulta
   * - {confirmationLink}: Link para confirmar presença
   */
  confirmationReminder: (
    clientName: string,
    professionalName: string,
    appointmentDate: string,
    confirmationLink: string,
  ) => {
    return `Olá ${clientName}! 👋\n\n⏰ Lembramos que você tem uma consulta agendada com ${professionalName} em:\n📅 ${appointmentDate}\n\n✅ Para confirmar sua presença, clique no link abaixo:\n${confirmationLink}\n\nEste link é válido por 7 dias.\n\nQualquer dúvida, entre em contato conosco! 📞`;
  },

  /**
   * Mensagem de confirmação bem-sucedida
   */
  confirmationSuccess: (clientName: string) => {
    return `Perfeito ${clientName}! ✅\n\nSua presença foi confirmada com sucesso! Nos vemos em breve! 😊`;
  },

  /**
   * Mensagem de lembrete no dia da consulta
   */
  dayOfAppointment: (clientName: string, appointmentTime: string) => {
    return `Oi ${clientName}! 👋\n\n🕐 Sua consulta é hoje às ${appointmentTime}!\n\nNão se esqueça de trazer seus documentos. Até logo! 😊`;
  },

  /**
   * Mensagem de cancelamento
   */
  cancellation: (clientName: string, reason?: string) => {
    return `Oi ${clientName}, 😔\n\nInfelizmente, sua consulta foi cancelada.${reason ? `\n\nMotivo: ${reason}` : ''}\n\nFaça contato conosco para reagendar! 📞`;
  },
};
