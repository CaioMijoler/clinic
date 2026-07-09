import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { MarkAsReadNotificationDto } from './dto/mark-as-read-notification.dto';
import { ResponseNotificationDto } from './dto/response-notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<ResponseNotificationDto> {
    const notification = await this.notificationRepository.save({
      description: createNotificationDto.description,
      medicalRecordId: createNotificationDto.medicalRecordId,
      read: createNotificationDto.read ?? false,
      userId: createNotificationDto.userId
    });
    return notification;
  }

  async findAll(userId: number): Promise<ResponseNotificationDto[]> {
    const notification = await this.notificationRepository.find({
      where: {
        userId: userId
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return notification;
  }

  async countUnread(userId: number): Promise<{ count: number }> {
    const count = await this.notificationRepository.count({
      where: {
        userId,
        read: false,
      },
    });

    return { count };
  }

  async markAsRead(markAsReadDto: MarkAsReadNotificationDto): Promise<void> {
    const { notificationIds } = markAsReadDto;
    await this.notificationRepository.update(
      { id: In(notificationIds) },
      { read: true },
    );
  }

  async removeByMedicalRecord(medicalRecordId: number): Promise<void> {
    await this.notificationRepository.delete({ medicalRecordId });
  }

  async removeOlderThan(
    userId: number,
    days: number,
  ): Promise<{ deleted: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await this.notificationRepository.delete({
      userId,
      createdAt: LessThan(cutoffDate.toISOString()),
    });

    return { deleted: result.affected ?? 0 };
  }
}
