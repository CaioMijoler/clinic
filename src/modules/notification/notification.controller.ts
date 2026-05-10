import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { MarkAsReadNotificationDto } from './dto/mark-as-read-notification.dto';
import { ResponseNotificationDto } from './dto/response-notification.dto';

@ApiTags('Notification')
@ApiBearerAuth()
@Controller('v1/notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiResponse({ status: 201, type: ResponseNotificationDto, description: 'The notification has been successfully created.' })
  create(@Body() createNotificationDto: CreateNotificationDto): Promise<ResponseNotificationDto> {
    return this.notificationService.create(createNotificationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all notifications' })
  @ApiResponse({ status: 200, type: ResponseNotificationDto, isArray: true })
  findAll(@Req() req: Request): Promise<ResponseNotificationDto[]> {
    const userId = (req.user as any)?.id;
    return this.notificationService.findAll(userId);
  }

  @Put()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark multiple notifications as read' })
  @ApiResponse({ status: 204, description: 'Notifications marked as read.' })
  markAsRead(@Body() markAsReadDto: MarkAsReadNotificationDto) {
    return this.notificationService.markAsRead(markAsReadDto);
  }

  @Delete(':medicalRecordId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete notifications by medical record ID' })
  @ApiResponse({ status: 204, description: 'Notifications deleted successfully.' })
  removeByMedicalRecord(@Param('medicalRecordId') medicalRecordId: string) {
    return this.notificationService.removeByMedicalRecord(+medicalRecordId);
  }
}
