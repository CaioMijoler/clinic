import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
} from '@nestjs/common';
import { QuestionsService } from './questions.service';
import {
  CreateQuestionDto,
  ResponseQuestionDto,
} from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FilterDto } from '@app/utils/filter-dto';
import { IPaginate } from '@app/utils/paginate';

@ApiTags('questions')
@Controller('v1/questions')
@ApiBearerAuth()
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  async create(@Body() createQuestionDto: CreateQuestionDto) {
    return await this.questionsService.create(createQuestionDto);
  }

  @Get()
  async findAll(
    @Query() queryParams: FilterDto,
  ): Promise<IPaginate<ResponseQuestionDto> | ResponseQuestionDto[]> {
    return await this.questionsService.findAll(queryParams);
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return await this.questionsService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateQuestionDto: UpdateQuestionDto,
  ) {
    return await this.questionsService.update(id, updateQuestionDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    return await this.questionsService.remove(id);
  }
}
