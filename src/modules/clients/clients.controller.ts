import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Put,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { FilterDto } from '../../utils/filter-dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('clients')
@Controller('v1/clients')
@ApiBearerAuth()
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  create(@Body() createClientDto: CreateClientDto, @Req() req: Request) {
    return this.clientsService.create(createClientDto, req?.user as any);
  }

  @Get()
  findAll(@Query() queryParams: FilterDto, @Req() req: Request) {
    return this.clientsService.findAll(queryParams, req?.user as any);
  }

  @Get(':id')
  findOne(@Param('id') id: number, @Req() req: Request) {
    return this.clientsService.findOne(id, req?.user as any);
  }

  @Put(':id')
  update(
    @Param('id') id: number,
    @Body() updateClientDto: UpdateClientDto,
    @Req() req: Request,
  ) {
    return this.clientsService.update(id, updateClientDto, req?.user as any);
  }

  @Delete(':id')
  remove(@Param('id') id: number, @Req() req: Request) {
    return this.clientsService.remove(id, req?.user as any);
  }
}
