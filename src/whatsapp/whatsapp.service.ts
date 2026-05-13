import { Injectable, Logger, BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { SendTemplateMessageDto } from './dto/send-template-message.dto';
import { WhatsappCredentialsDto } from './dto/whatsapp-credentials.dto';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly apiUrl: string;
  private readonly recentMessages: Map<string, number> = new Map();
  private readonly DUPLICATE_CHECK_TIMEOUT_MS = 30000; // 30 segundos

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('whatsapp.url');
  }

  /**
   * Envia mensagem usando template aprovado do WhatsApp Business.
   * Templates são obrigatórios para mensagens proativas (fora da janela de 24h).
   *
   * Proteção contra envios duplicados: rastreia mensagens enviadas nos últimos 30 segundos
   * para evitar reenvios acidentais para o mesmo destinatário com o mesmo template.
   */
  async sendTemplateMessage(
    credentials: WhatsappCredentialsDto,
    params: SendTemplateMessageDto,
  ) {
    // Gera chave única para esta mensagem (telefone + template + params)
    const messageKey = `${params.to}|${params.templateName}|${JSON.stringify(params.bodyParameters || [])}`;
    const now = Date.now();

    // Verifica se uma mensagem idêntica foi enviada recentemente
    const lastSentTime = this.recentMessages.get(messageKey);
    if (lastSentTime && now - lastSentTime < this.DUPLICATE_CHECK_TIMEOUT_MS) {
      this.logger.warn(
        `Mensagem duplicada detectada para ${params.to} - template: ${params.templateName}. Enviada há ${Math.round((now - lastSentTime) / 1000)}s atrás. Cancelando reenvio.`,
      );
      return {
        success: false,
        message: 'Mensagem duplicada - já foi enviada recentemente',
      };
    }

    const url = `${this.apiUrl}/${credentials.whatsappId}/messages`;
    const components: any[] = [];

    // Parâmetros do Corpo (Body)
    if (params.bodyParameters?.length) {
      components.push({
        type: 'body',
        parameters: params.bodyParameters.map((text) => ({
          type: 'text',
          text,
        })),
      });
    }

    // Parâmetro do Botão (URL Dinâmica)
    if (params.buttonParameters?.length) {
      components.push({
        type: 'button',
        sub_type: 'url',
        index: '0',
        parameters: params.buttonParameters.map((val) => ({
          type: 'text',
          text: typeof val === 'string' ? val : val.text,
        })),
      });
    }

    const data = {
      messaging_product: 'whatsapp',
      to: params.to,
      type: 'template',
      template: {
        name: params.templateName,
        language: { code: 'en' },
        components,
      },
    };

    try {
      const response = await axios.post(url, data, {
        headers: {
          Authorization: `Bearer ${credentials.whatsappToken}`,
          'Content-Type': 'application/json',
        },
      });

      // Registra o envio bem-sucedido
      this.recentMessages.set(messageKey, now);

      // Limpa mensagens antigas (mais de 1 minuto) do cache
      this.cleanupOldMessages();

      this.logger.log(
        `Template "${params.templateName}" enviado para ${params.to}`,
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Falha ao enviar template "${params.templateName}": ${error.response ? JSON.stringify(error.response.data) : error.message}`,
      );
      throw new BadGatewayException(
        `Failed to send template message: ${error.response ? JSON.stringify(error.response.data) : error.message}`,
      );
    }
  }

  /**
   * Remove mensagens antigas do cache de prevenção de duplicatas.
   * Mantém apenas as últimas enviadas nos últimos 2 minutos.
   */
  private cleanupOldMessages(): void {
    const now = Date.now();
    const maxAge = 2 * 60 * 1000; // 2 minutos

    for (const [key, timestamp] of this.recentMessages.entries()) {
      if (now - timestamp > maxAge) {
        this.recentMessages.delete(key);
      }
    }
  }
}
