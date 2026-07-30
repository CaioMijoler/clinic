import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { QuestionsService } from './questions.service';
import {
  CreateQuestionDto,
  ResponseQuestionDto,
} from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FilterDto } from '../../utils/filter-dto';
import { IPaginate } from '../../utils/paginate';

@ApiTags('questions')
@Controller('v1/questions')
@ApiBearerAuth()
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  async create(
    @Body() createQuestionDto: CreateQuestionDto,
    @Req() req: Request,
  ) {
    return await this.questionsService.create(
      createQuestionDto,
      req?.user as any,
    );
  }

  @Get()
  async findAll(
    @Query() queryParams: FilterDto,
    @Req() req: Request,
  ): Promise<IPaginate<ResponseQuestionDto> | ResponseQuestionDto[]> {
    return await this.questionsService.findAll(queryParams, req?.user as any);
  }

  @Get(':id')
  async findOne(@Param('id') id: number, @Req() req: Request) {
    return await this.questionsService.findOne(id, req?.user as any);
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateQuestionDto: UpdateQuestionDto,
    @Req() req: Request,
  ) {
    return await this.questionsService.update(
      id,
      updateQuestionDto,
      req?.user as any,
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: number, @Req() req: Request) {
    return await this.questionsService.remove(id, req?.user as any);
  }
}
