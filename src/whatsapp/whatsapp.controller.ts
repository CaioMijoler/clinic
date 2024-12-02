import { Controller, Post, Body } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { CreateWhatsappDto } from './dto/create-whatsapp.dto';
import { ApiTags } from '@nestjs/swagger';

@Controller('whatsapp')
@ApiTags('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Post()
  create(@Body() createWhatsappDto: CreateWhatsappDto) {
    return this.whatsappService.sendMessage(createWhatsappDto);
  }
}
