import { Controller, Post, Body, Req } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { SendTemplateMessageDto } from './dto/send-template-message.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { User } from '@app/modules/user/entities/user.entity';

@Controller('whatsapp')
@ApiTags('whatsapp')
@ApiBearerAuth()
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Post()
  create(@Req() req: Request, @Body() sendTemplateMessageDto: SendTemplateMessageDto) {
    const user = req.user as User;
    return this.whatsappService.sendTemplateMessage(
      {
        whatsappToken: user.whatsAppToken,
        whatsappId: user.whatsAppId,
      },
      sendTemplateMessageDto,
    );
  }
}
