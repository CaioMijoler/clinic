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
import { FeedbackService } from './feedback.service';
import {
  CreateFeedbackDto,
  FeedBackResponseDto,
} from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FilterDto } from '../../utils/filter-dto';
import { IPaginate } from '../../utils/paginate';
import { Feedback } from './entities/feedback.entity';

@ApiTags('feedback')
@Controller('v1/feedback')
@ApiBearerAuth()
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  async create(
    @Body() createFeedbackDto: CreateFeedbackDto,
  ): Promise<FeedBackResponseDto> {
    return await this.feedbackService.create(createFeedbackDto);
  }

  @Get()
  async findAll(
    @Query() queryParams: FilterDto,
  ): Promise<IPaginate<Feedback> | Feedback[]> {
    return await this.feedbackService.findAll(queryParams);
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<FeedBackResponseDto> {
    return await this.feedbackService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateFeedbackDto: UpdateFeedbackDto,
  ): Promise<FeedBackResponseDto> {
    return await this.feedbackService.update(id, updateFeedbackDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number): Promise<void> {
    return await this.feedbackService.remove(id);
  }
}
