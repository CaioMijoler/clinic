import { Controller, Post, Body } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { SendTemplateMessageDto } from './dto/send-template-message.dto';
import { ApiTags } from '@nestjs/swagger';

@Controller('whatsapp')
@ApiTags('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Post()
  create(@Body() sendTemplateMessageDto: SendTemplateMessageDto) {
    return this.whatsappService.sendTemplateMessage(sendTemplateMessageDto);
  }
}
