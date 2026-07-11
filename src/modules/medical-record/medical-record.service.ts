import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateMedicalRecordDto,
  MedicalRecordResponseDto,
} from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { User } from '../user/entities/user.entity';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { MedicalRecord } from './entities/medical-record.entity';
import { Client } from '../clients/entities/client.entity';
import { CreateClientDto } from '../clients/dto/create-client.dto';
import { CreateTreatmentDto } from '../treatment/dto/create-treatment.dto';
import { Treatment } from '../treatment/entities/treatment.entity';
import { findAllWithQueryBuilder } from '../../utils/query-builder';
import { FilterDto } from '../../utils/filter-dto';
import { IPaginate } from '../../utils/paginate';
import { MedicalRecordStatusEnum } from '../../utils/enum/medical-record.enum';
import { AppointmentStatusEnum } from '../../utils/enum/appointment-status.enum';
import { AppointmentCanceledByEnum } from '../../utils/enum/appointment-canceled-by.enum';
import { CreateMedicalRecordPathologyDto } from './dto/medical-record-pathologies/create-medical-record-pathologies.dto';
import { MedicalRecordPathologies } from './entities/medical-record-pathologies.entity';
import { CreateMedicalRecordQuestionsDto } from './dto/medical-record-questions/create-medical-record-questions.dto';
import { MedicalRecordQuestion } from './entities/medical-record-questions.entity';
import { CreateFeedbackDto } from '../feedback/dto/create-feedback.dto';
import { Feedback } from '../feedback/entities/feedback.entity';
import { MedicalRecordDocument } from './entities/medical-record-documents.entity';
import { MedicalRecordDocumentResponseDto } from './dto/medical-record-documents/medical-record-documents-response.dto';
import { MedicalRecordService as MedicalRecordServiceEntity } from './entities/medical-record-service.entity';
import { CreateMedicalRecordServiceItemDto } from './dto/medical-record-services/create-medical-record-service.dto';
import { Service } from '../services/entities/service.entity';
import { Appointment } from '../appointments/entities/appointment.entity';

const ACTIVE_APPOINTMENT_STATUSES = [
  AppointmentStatusEnum.CREATED,
  AppointmentStatusEnum.SCHEDULED,
  AppointmentStatusEnum.CONFIRMED_SCHEDULE,
  AppointmentStatusEnum.IN_PROGRESS,
] as const;

@Injectable()
export class MedicalRecordService {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @InjectRepository(MedicalRecord)
    private readonly medicalRecordRepository: Repository<MedicalRecord>,
    @InjectRepository(MedicalRecordDocument)
    private readonly medicalRecordDocumentRepository: Repository<MedicalRecordDocument>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
  ) {}

  async create(
    createMedicalRecordDto: CreateMedicalRecordDto,
    user: User,
  ): Promise<MedicalRecordResponseDto> {
    try {
      const {
        client,
        medicalRecordPathologies,
        treatments,
        medicalRecordQuestions,
        feedbacks,
        services,
        ...medicalRecordData
      } = createMedicalRecordDto;

      const dataSourceResponse = await this.dataSource.transaction(
        async (manager) => {
          const auth = await this.validateUser(manager, user);

          let newClient = null;
          if (client) {
            newClient = await this.createOrUpdateClient(manager, client);
          }

          const finalClientId = newClient?.id || medicalRecordData.clientId;

          const medicalData = await manager.save(MedicalRecord, {
            ...medicalRecordData,
            userId: auth?.id,
            clientId: finalClientId,
            status: createMedicalRecordDto?.conclusion
              ? MedicalRecordStatusEnum.FINISHED
              : MedicalRecordStatusEnum.PENDING,
          });

          const newPathologies = await this.createOrUpdatePathologies(
            manager,
            medicalRecordPathologies,
            medicalData,
            'create',
          );
          const newTreatments = await this.createOrUpdateTreatments(
            manager,
            treatments,
            medicalData,
            'create',
          );
          const newQuestions = await this.createOrUpdateQuestions(
            manager,
            medicalRecordQuestions,
            medicalData,
            'create',
          );
          const newFeedbacks = await this.createOrUpdateFeedbacks(
            manager,
            feedbacks,
            medicalData,
            'create',
          );
          const medicalRecordServicesResult =
            services !== undefined
              ? await this.createOrUpdateMedicalRecordServices(
                  manager,
                  services,
                  medicalData,
                  auth.id,
                )
              : { services: [], totalValue: null };

          return {
            ...medicalData,
            totalValue: medicalRecordServicesResult.totalValue ?? medicalData.totalValue ?? null,
            client: newClient
              ? {
                  ...newClient,
                  clientAddress: newClient.clientAddress,
                }
              : null,
            medicalRecordPathologies: newPathologies,
            treatments: newTreatments,
            medicalRecordQuestions: newQuestions,
            feedbacks: newFeedbacks,
            medicalRecordServices: medicalRecordServicesResult.services,
          };
        },
      );

      return dataSourceResponse;
    } catch (error) {
      const message = 'Ocorreu um erro ao criar o prontuário.';

      if (error instanceof HttpException) {
        throw error.getResponse();
      }

      Logger.error(message, error?.stack ?? error.message);

      throw new BadRequestException(message);
    }
  }

  async findAll(
    queryParams: FilterDto,
    user: User,
  ): Promise<IPaginate<MedicalRecordResponseDto> | MedicalRecordResponseDto[]> {
    try {
      const params: FilterDto = {
        ...queryParams,
        filter: {
          ...queryParams.filter,
          userId: String(user.id),
        },
      };

      const data = await findAllWithQueryBuilder<MedicalRecord>(
        this.medicalRecordRepository,
        params,
        'mr',
      );

      return data as
        | IPaginate<MedicalRecordResponseDto>
        | MedicalRecordResponseDto[];
    } catch (error) {
      const message = 'Ocorreu um erro ao buscar os prontuários.';
      Logger.error(message, error?.stack ?? error.message);
      throw new BadRequestException(message);
    }
  }

  async findByClient(
    clientId: number,
    queryParams: FilterDto,
  ): Promise<IPaginate<MedicalRecordResponseDto> | MedicalRecordResponseDto[]> {
    try {
      const params: FilterDto = {
        ...queryParams,
        filter: { ...queryParams.filter, clientId: String(clientId) },
      };

      const data = await findAllWithQueryBuilder<MedicalRecord>(
        this.medicalRecordRepository,
        params,
        'mr',
      );

      const records = Array.isArray(data) ? data : data.data;
      const enriched = await Promise.all(
        records.map(async (record) => {
          const sessionStats = await this.getSessionStats(record.id);
          return { ...record, ...sessionStats };
        }),
      );

      if (Array.isArray(data)) {
        return enriched as MedicalRecordResponseDto[];
      }

      return {
        ...data,
        data: enriched,
      } as IPaginate<MedicalRecordResponseDto>;
    } catch (error) {
      const message = 'Ocorreu um erro ao buscar os prontuários do cliente.';
      Logger.error(message, error?.stack ?? error.message);
      throw new BadRequestException(message);
    }
  }

  async findDocuments(
    medicalRecordId: number,
    queryParams: FilterDto,
  ): Promise<IPaginate<MedicalRecordDocumentResponseDto> | MedicalRecordDocumentResponseDto[]> {
    try {
      const params: FilterDto = {
        ...queryParams,
        filter: { ...queryParams.filter, medicalRecordId: String(medicalRecordId) },
      };

      const data = await findAllWithQueryBuilder<MedicalRecordDocument>(
        this.medicalRecordDocumentRepository,
        params,
        'mrd',
      );

      return data;
    } catch (error) {
      const message = 'Ocorreu um erro ao buscar os documentos do prontuário.';
      Logger.error(message, error?.stack ?? error.message);
      throw new BadRequestException(message);
    }
  }

  async findOne(id: number): Promise<MedicalRecordResponseDto> {
    const data = await this.medicalRecordRepository.findOne({
      where: { id },
      relations: [
        'feedbacks',
        'client',
        'medicalRecordQuestions',
        'medicalRecordPathologies',
        'pathologies',
        'questions',
        'treatments',
        'medicalRecordServices',
        'medicalRecordServices.service',
      ],
    });

    if (!data) {
      throw new NotFoundException(
        'Não conseguimos encontrar o prontuário, por favor tente novamente!',
      );
    }

    const latestAppointment = await this.appointmentRepository.findOne({
      where: { medicalRecordId: id },
      order: { startDate: 'DESC' },
    });

    const sessionStats = await this.getSessionStats(id);

    return {
      ...(data as MedicalRecordResponseDto),
      latestAppointmentId: latestAppointment?.id,
      latestAppointmentStatus: latestAppointment?.status,
      ...sessionStats,
    };
  }

  async update(
    id: number,
    updateMedicalRecordDto: UpdateMedicalRecordDto,
    user: User,
  ): Promise<MedicalRecordResponseDto> {
    try {
      const {
        client,
        medicalRecordPathologies,
        treatments,
        medicalRecordQuestions,
        feedbacks,
        services,
        ...medicalRecordData
      } = updateMedicalRecordDto;
      const medicalRecord = await this.medicalRecordRepository.findOne({
        where: { id },
        relations: [
          'medicalRecordQuestions',
          'questions',
          'medicalRecordPathologies',
          'pathologies',
          'feedbacks',
          'client',
          'treatments',
          'medicalRecordServices',
          'medicalRecordServices.service',
        ],
      });
      if (!medicalRecord) {
        throw new NotFoundException(
          'Não conseguimos encontrar o prontuário, por favor tente novamente!',
        );
      }
      const dataSourceResponse = await this.dataSource.transaction(
        async (manager) => {
          const auth = await this.validateUser(manager, user);
          let newClient = medicalRecord?.client;
          if (medicalRecord?.client) {
            newClient = await this.createOrUpdateClient(manager, client);
          }

          manager.merge(MedicalRecord, medicalRecord, medicalRecordData);
          const nextStatus = updateMedicalRecordDto.conclusion?.trim()
            ? MedicalRecordStatusEnum.FINISHED
            : medicalRecord.status;
          const medicalData = await manager.save(MedicalRecord, {
            ...medicalRecord,
            userId: auth?.id,
            clientId: newClient?.id,
            status: nextStatus,
          });

          let newPathologies = medicalRecord?.medicalRecordPathologies ?? [];
          let newTreatments = medicalRecord?.treatments ?? [];
          let newQuestions = medicalRecord?.medicalRecordQuestions ?? [];
          let newFeedbacks = medicalRecord?.feedbacks ?? [];
          let newMedicalRecordServices = medicalRecord?.medicalRecordServices ?? [];

          newPathologies = await this.createOrUpdatePathologies(
            manager,
            medicalRecordPathologies,
            medicalData,
            'create',
          );
          newTreatments = await this.createOrUpdateTreatments(
            manager,
            treatments,
            medicalData,
            'create',
          );
          newQuestions = await this.createOrUpdateQuestions(
            manager,
            medicalRecordQuestions,
            medicalData,
            'create',
          );
          newFeedbacks = await this.createOrUpdateFeedbacks(
            manager,
            feedbacks,
            medicalData,
            'create',
          );

          if (services !== undefined) {
            const medicalRecordServicesResult =
              await this.createOrUpdateMedicalRecordServices(
                manager,
                services,
                medicalData,
                auth.id,
              );
            newMedicalRecordServices = medicalRecordServicesResult.services;
            medicalData.totalValue = medicalRecordServicesResult.totalValue;
          }

          return {
            ...medicalData,
            client: newClient,
            medicalRecordPathologies: newPathologies,
            treatments: newTreatments,
            medicalRecordQuestions: newQuestions,
            feedbacks: newFeedbacks,
            medicalRecordServices: newMedicalRecordServices,
          };
        },
      );

      return dataSourceResponse as MedicalRecordResponseDto;
    } catch (error) {
      const message = 'Ocorreu um erro ao atualizar o prontuário.';

      if (error instanceof HttpException) {
        throw error.getResponse();
      }

      Logger.error(message, error?.stack ?? error.message);

      throw new BadRequestException(message);
    }
  }

  async remove(id: number) {
    try {
      const medicalRecord = await this.medicalRecordRepository.findOne({
        where: { id },
      });

      if (!medicalRecord) {
        throw new BadRequestException(
          'Não conseguimos encontrar o prontuário, tente novamente!',
        );
      }

      if (medicalRecord.status === MedicalRecordStatusEnum.CANCELED) {
        return { success: true, id: medicalRecord.id };
      }

      await this.dataSource.transaction(async (manager) => {
        await manager.update(MedicalRecord, medicalRecord.id, {
          status: MedicalRecordStatusEnum.CANCELED,
        });

        await manager.update(
          Appointment,
          {
            medicalRecordId: medicalRecord.id,
            status: In([...ACTIVE_APPOINTMENT_STATUSES]),
          },
          {
            status: AppointmentStatusEnum.CANCELED,
            canceledBy: AppointmentCanceledByEnum.ADMIN,
          },
        );
      });

      return { success: true, id: medicalRecord.id };
    } catch (error) {
      const message = 'Ocorreu um erro ao cancelar o prontuário.';

      if (error instanceof HttpException) {
        throw error;
      }

      Logger.error(message, error?.stack ?? error.message);

      throw new BadRequestException(message);
    }
  }

  private async validateUser(
    manager: EntityManager,
    user: User,
  ): Promise<User> {
    const authUser = await manager.findOne(User, {
      where: { id: user.id },
      select: [
        'id',
        'name',
        'whatsAppId',
        'whatsAppToken',
      ],
    });

    if (!authUser) {
      throw new NotFoundException('Não conseguimos encontrar o usuário.');
    }

    return authUser;
  }

  async createOrUpdateClient(
    manager: EntityManager,
    clientDto: CreateClientDto,
  ) {
    if (!clientDto) return null;
    const createdClient =
      clientDto?.document &&
      (await manager.findOne(Client, {
        where: { document: clientDto?.document },
      }));

    if (createdClient?.document) {
      await manager.merge(Client, createdClient, {
        ...clientDto,
        id: createdClient?.id,
      });
      return await manager.save(Client, createdClient);
    }
    return await manager.save(Client, clientDto);
  }

  async createOrUpdatePathologies(
    manager: EntityManager,
    medicalRecordPathologiesDto: CreateMedicalRecordPathologyDto[],
    medicalRecord: MedicalRecord,
    type?: string,
  ) {
    const allPathologies = await manager.find(MedicalRecordPathologies, {
      where: { medicalRecordId: medicalRecord?.id },
    });
    if (!medicalRecordPathologiesDto.length) {
      return [];
    }

    if (type === 'update') {
      for (const pathology of allPathologies) {
        await manager.remove(MedicalRecordPathologies, pathology);
      }
    }

    const newPathologies: MedicalRecordPathologies[] = [];
    for (const pathologyItemData of medicalRecordPathologiesDto) {
      const existingPathologyItem = allPathologies?.find(
        (pathology) =>
          pathology.medicalRecordId === medicalRecord.id &&
          pathology.pathologiesId === pathologyItemData.pathologiesId,
      );

      if (existingPathologyItem) {
        await manager.merge(MedicalRecordPathologies, existingPathologyItem, {
          ...pathologyItemData,
          medicalRecordId: medicalRecord?.id,
        });

        newPathologies.push(existingPathologyItem);
        await manager.save(MedicalRecordPathologies, existingPathologyItem);
      } else {
        const newPathologyItem: MedicalRecordPathologies = {
          ...pathologyItemData,
          medicalRecordId: medicalRecord?.id,
        } as MedicalRecordPathologies;

        newPathologies.push(newPathologyItem);
        await manager.save(MedicalRecordPathologies, newPathologyItem);
      }
    }
    return newPathologies;
  }

  async createOrUpdateTreatments(
    manager: EntityManager,
    treatmentDto: CreateTreatmentDto[],
    medicalRecord: MedicalRecord,
    type?: string,
  ) {
    const allTreatmentsPathologies = await manager.find(Treatment, {
      where: { medicalRecordId: medicalRecord?.id },
    });
    if (!treatmentDto.length) {
      return [];
    }

    if (type === 'update') {
      for (const treatment of allTreatmentsPathologies) {
        await manager.remove(Treatment, treatment);
      }
    }

    const newTreatment: Treatment[] = [];
    for (const treatmentItemData of treatmentDto) {
      const existingTreatmentItem = allTreatmentsPathologies?.find(
        (treatment) => treatment.description === treatmentItemData.description,
      );

      if (existingTreatmentItem) {
        await manager.merge(Treatment, existingTreatmentItem, {
          ...treatmentItemData,
          medicalRecordId: medicalRecord?.id,
        });

        newTreatment.push(existingTreatmentItem);
        await manager.save(Treatment, existingTreatmentItem);
      } else {
        const newTreatmentItem: Treatment = {
          ...treatmentItemData,
          medicalRecordId: medicalRecord?.id,
        } as Treatment;

        newTreatment.push(newTreatmentItem);
        await manager.save(Treatment, newTreatmentItem);
      }
    }
    return newTreatment;
  }

  async createOrUpdateQuestions(
    manager: EntityManager,
    questionsDto: CreateMedicalRecordQuestionsDto[],
    medicalRecord: MedicalRecord,
    type?: string,
  ) {
    const allQuestions = await manager.find(MedicalRecordQuestion, {
      where: { medicalRecordId: medicalRecord?.id },
    });
    if (!questionsDto.length) {
      return [];
    }

    if (type === 'update') {
      for (const question of allQuestions) {
        await manager.remove(MedicalRecordQuestion, question);
      }
    }

    const newQuestions: MedicalRecordQuestion[] = [];
    for (const questionItemData of questionsDto) {
      const existingQuestionItem = allQuestions?.find(
        (question) =>
          question.medicalRecordId === medicalRecord.id &&
          question.questionId === questionItemData.questionId,
      );

      if (existingQuestionItem) {
        await manager.merge(MedicalRecordQuestion, existingQuestionItem, {
          ...questionItemData,
          medicalRecordId: medicalRecord?.id,
        });

        newQuestions.push(existingQuestionItem);
        await manager.save(MedicalRecordQuestion, existingQuestionItem);
      } else {
        const newQuestionItem: MedicalRecordQuestion = {
          ...questionItemData,
          medicalRecordId: medicalRecord?.id,
        } as MedicalRecordQuestion;

        newQuestions.push(newQuestionItem);
        await manager.save(MedicalRecordQuestion, newQuestionItem);
      }
    }
    return newQuestions;
  }

  async createOrUpdateFeedbacks(
    manager: EntityManager,
    feedbacksDto: CreateFeedbackDto[],
    medicalRecord: MedicalRecord,
    type?: string,
  ) {
    const allFeedbacks = await manager.find(Feedback, {
      where: { medicalRecordId: medicalRecord?.id },
    });

    if (!feedbacksDto?.length) {
      return [];
    }

    if (type === 'update') {
      for (const feedback of allFeedbacks) {
        await manager.remove(Feedback, feedback);
      }
    }

    const newFeedbacks: Feedback[] = [];
    for (const feedbackItemData of feedbacksDto) {
      const existingFeedbackItem = allFeedbacks?.find(
        (feedback) => feedback.description === feedbackItemData.description,
      );

      if (existingFeedbackItem) {
        await manager.merge(Feedback, existingFeedbackItem, {
          ...feedbackItemData,
          medicalRecordId: medicalRecord?.id,
        });

        newFeedbacks.push(existingFeedbackItem);
        await manager.save(Feedback, existingFeedbackItem);
      } else {
        const newFeedbackItem: Feedback = {
          ...feedbackItemData,
          medicalRecordId: medicalRecord?.id,
        } as Feedback;

        newFeedbacks.push(newFeedbackItem);
        await manager.save(Feedback, newFeedbackItem);
      }
    }

    return newFeedbacks;
  }

  async createOrUpdateMedicalRecordServices(
    manager: EntityManager,
    servicesDto: CreateMedicalRecordServiceItemDto[],
    medicalRecord: MedicalRecord,
    userId: number,
  ): Promise<{
    services: MedicalRecordServiceEntity[];
    totalValue: number | null;
  }> {
    const existingServices = await manager.find(MedicalRecordServiceEntity, {
      where: { medicalRecordId: medicalRecord.id },
    });

    for (const existingService of existingServices) {
      await manager.remove(MedicalRecordServiceEntity, existingService);
    }

    if (!servicesDto?.length) {
      await manager.update(MedicalRecord, medicalRecord.id, { totalValue: null });
      return { services: [], totalValue: null };
    }

    const serviceIds = [...new Set(servicesDto.map((item) => item.serviceId))];
    const catalogServices = await manager.find(Service, {
      where: serviceIds.map((id) => ({ id, userId })),
    });

    if (catalogServices.length !== serviceIds.length) {
      throw new BadRequestException(
        'Não conseguimos encontrar um dos serviços selecionados.',
      );
    }

    const serviceById = new Map(
      catalogServices.map((service) => [service.id, service]),
    );

    for (const item of servicesDto) {
      const service = serviceById.get(item.serviceId);

      if (!service?.active) {
        throw new BadRequestException(
          `O serviço "${service?.name ?? item.serviceId}" está inativo.`,
        );
      }
    }

    const savedServices: MedicalRecordServiceEntity[] = [];

    for (const item of servicesDto) {
      const savedService = await manager.save(
        MedicalRecordServiceEntity,
        manager.create(MedicalRecordServiceEntity, {
          medicalRecordId: medicalRecord.id,
          serviceId: item.serviceId,
          durationMinutes: item.durationMinutes,
          totalValue: item.courtesy ? 0 : item.totalValue,
          courtesy: item.courtesy ?? false,
          discount: item.discount ?? 0,
          quantitySessions: item.quantitySessions ?? 1,
        }),
      );

      savedServices.push(savedService);
    }

    const totalValue = servicesDto.reduce(
      (sum, item) => sum + (item.courtesy ? 0 : Number(item.totalValue) || 0),
      0,
    );

    await manager.update(MedicalRecord, medicalRecord.id, { totalValue });

    const servicesWithRelations = await manager.find(MedicalRecordServiceEntity, {
      where: { medicalRecordId: medicalRecord.id },
      relations: ['service'],
    });

    return { services: servicesWithRelations, totalValue };
  }

  private async getSessionStats(
    medicalRecordId: number,
  ): Promise<{ totalSessions: number; completedSessions: number }> {
    const servicesResult = await this.dataSource
      .getRepository(MedicalRecordServiceEntity)
      .createQueryBuilder('mrs')
      .select('COALESCE(SUM(mrs.quantity_sessions), 0)', 'total')
      .where('mrs.medical_record_id = :medicalRecordId', { medicalRecordId })
      .getRawOne<{ total: string }>();

    const completedResult = await this.appointmentRepository
      .createQueryBuilder('appointment')
      .select('COUNT(appointment.id)', 'completed')
      .where('appointment.medical_record_id = :medicalRecordId', {
        medicalRecordId,
      })
      .andWhere('appointment.attended = :attended', { attended: true })
      .getRawOne<{ completed: string }>();

    return {
      totalSessions: Number(servicesResult?.total ?? 0),
      completedSessions: Number(completedResult?.completed ?? 0),
    };
  }
}
