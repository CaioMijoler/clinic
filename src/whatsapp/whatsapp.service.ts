import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CreateWhatsappDto } from './dto/create-whatsapp.dto';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly apiUrl: string;
  private readonly token: string;
  private readonly phoneNumberId: string;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('whatsapp.url');
    this.token = this.configService.get<string>('whatsapp.token');
    this.phoneNumberId = this.configService.get<string>('whatsapp.id');
  }

  async sendMessage(createWhatsappDto: CreateWhatsappDto) {
    const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
    const data = {
      messaging_product: 'whatsapp',
      to: createWhatsappDto.to,
      type: 'text',
      text: { body: createWhatsappDto.body },
    };

    try {
      const response = await axios.post(url, data, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Falha ao enviar mensagem: ${error.response ? JSON.stringify(error.response.data) : error.message}`,
      );
      throw new Error(
        `Failed to send message: ${error.response ? JSON.stringify(error.response.data) : error.message}`,
      );
    }
  }

  /**
   * Envia mensagem usando template aprovado do WhatsApp Business.
   * Templates são obrigatórios para mensagens proativas (fora da janela de 24h).
   */
  async sendTemplateMessage(params: {
    to: string;
    templateName: string;
    languageCode?: string;
    bodyParameters?: string[];
    buttonParameters?: { index: number; text: string }[];
  }) {
    const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;

    const components: any[] = [];

    if (params.bodyParameters?.length) {
      components.push({
        type: 'body',
        parameters: params.bodyParameters.map((text) => ({
          type: 'text',
          text,
        })),
      });
    }

    if (params.buttonParameters?.length) {
      for (const btn of params.buttonParameters) {
        components.push({
          type: 'button',
          sub_type: 'url',
          index: btn.index,
          parameters: [{ type: 'text', text: btn.text }],
        });
      }
    }

    const data = {
      messaging_product: 'whatsapp',
      to: params.to,
      type: 'template',
      template: {
        name: params.templateName,
        language: { code: params.languageCode || 'pt_BR' },
        components,
      },
    };

    try {
      const response = await axios.post(url, data, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });
      this.logger.log(`Template "${params.templateName}" enviado para ${params.to}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Falha ao enviar template "${params.templateName}": ${error.response ? JSON.stringify(error.response.data) : error.message}`,
      );
      throw new Error(
        `Failed to send template message: ${error.response ? JSON.stringify(error.response.data) : error.message}`,
      );
    }
  }
}

