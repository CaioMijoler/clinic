import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CreateWhatsappDto } from './dto/create-whatsapp.dto';

@Injectable()
export class WhatsappService {
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
      throw new Error(
        `Failed to send message: ${error.response ? JSON.stringify(error.response.data) : error.message}`,
      );
    }
  }
}
