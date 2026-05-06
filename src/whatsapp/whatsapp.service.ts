import { Injectable, Logger, BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { SendTemplateMessageDto } from './dto/send-template-message.dto';
import { WhatsappCredentialsDto } from './dto/whatsapp-credentials.dto';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly apiUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('whatsapp.url');
  }

  /**
   * Envia mensagem usando template aprovado do WhatsApp Business.
   * Templates são obrigatórios para mensagens proativas (fora da janela de 24h).
   */
  async sendTemplateMessage(
    credentials: WhatsappCredentialsDto,
    params: SendTemplateMessageDto,
  ) {
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
      this.logger.log(`Template "${params.templateName}" enviado para ${params.to}`);
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
}
