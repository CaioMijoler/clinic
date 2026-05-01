import { Injectable, Logger, InternalServerErrorException, BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CreateWhatsappDto } from './dto/create-whatsapp.dto';
import { SendTemplateMessageDto } from './dto/send-template-message.dto';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly apiUrl: string;
  private readonly token: string;
  private readonly phoneNumberId: string;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('whatsapp.url');
    this.token = this.configService.get<string>('whatsapp.token') ?? 'EAAbhcLFFJkQBRZAjHZAVWbehh5XkOqJ8z7GgmEoZBO82zkAkY1kN82UVGz3VX1gHZC5nZBWyqKN2HHbRaZAWVsVJkU9cMMXKb7MVEQmqRZB5hgFJ0Wxzr68FYqMsSQR0W9bAhCfRrEZATolAcaG7hiNOoJFZAsShXu8qY4p6Em4ZCP3hFhwQD9wi125Md3huxNeToqkr4vJZAwnCQexmGZCoj8OhCRJPEQfkAOGxoT1K';
    this.phoneNumberId = this.configService.get<string>('whatsapp.id') ?? '321542107713291';
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
      throw new BadGatewayException(
        `Failed to send message: ${error.response ? JSON.stringify(error.response.data) : error.message}`,
      );
    }
  }

  /**
   * Envia mensagem usando template aprovado do WhatsApp Business.
   * Templates são obrigatórios para mensagens proativas (fora da janela de 24h).
   */
  async sendTemplateMessage(params: SendTemplateMessageDto) {
    const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
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

    // ADICIONE ISSO: Parâmetro do Botão (URL Dinâmica)
    // Supondo que o último parâmetro que você está enviando seja o sufixo da URL
    if (params.buttonParameters?.length) {
      components.push({
        type: 'button',
        sub_type: 'url',
        index: '0',
        parameters: params.buttonParameters.map((val) => ({
          type: 'text',
          text: typeof val === 'string' ? val : val.text, // Garante que seja apenas a string
        })),
      });
    }

     const data = {
      messaging_product: 'whatsapp',
      to: params.to,
      type: 'template',
      template: {
        name: params.templateName,
        language: { code: 'en' }, // Garanta que o idioma está exatamente assim
        components,
      },
    };
    console.log('data', JSON.stringify(data))
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
      throw new BadGatewayException(
        `Failed to send template message: ${error.response ? JSON.stringify(error.response.data) : error.message}`,
      );
    }
  }
}

