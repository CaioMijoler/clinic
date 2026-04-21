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
import { DataSource, EntityManager, Repository } from 'typeorm';
import { MedicalRecord } from './entities/medical-record.entity';
import { Client } from '../clients/entities/client.entity';
import { CreateClientDto } from '../clients/dto/create-client.dto';
import { CreateTreatmentDto } from '../treatment/dto/create-treatment.dto';
import { Treatment } from '../treatment/entities/treatment.entity';
import { findAllWithQueryBuilder } from '../../utils/query-builder';
import { FilterDto } from '../../utils/filter-dto';
import { IPaginate } from '../../utils/paginate';
import { MedicalRecordStatusEnum } from '../../utils/enum/medical-record.enum';
import { CreateMedicalRecordPathologyDto } from './dto/medical-record-pathologies/create-medical-record-pathologies.dto';
import { MedicalRecordPathologies } from './entities/medical-record-pathologies.entity';
import { CreateMedicalRecordQuestionsDto } from './dto/medical-record-questions/create-medical-record-questions.dto';
import { MedicalRecordQuestion } from './entities/medical-record-questions.entity';

@Injectable()
export class MedicalRecordService {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @InjectRepository(MedicalRecord)
    private readonly medicalRecordRepository: Repository<MedicalRecord>,
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
            status: createMedicalRecordDto?.conclusion ? MedicalRecordStatusEnum.CONCLUDED : MedicalRecordStatusEnum.CREATED,
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

          return {
            ...medicalData,
            client: newClient
              ? {
                  ...newClient,
                  clientAddress: newClient.clientAddress,
                }
              : null,
            medicalRecordPathologies: newPathologies,
            treatments: newTreatments,
            medicalRecordQuestions: newQuestions,
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
  ): Promise<IPaginate<MedicalRecordResponseDto> | MedicalRecordResponseDto[]> {
    try {
      const data = await findAllWithQueryBuilder<MedicalRecord>(
        this.medicalRecordRepository,
        queryParams,
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

      return data as
        | IPaginate<MedicalRecordResponseDto>
        | MedicalRecordResponseDto[];
    } catch (error) {
      const message =
        'Ocorreu um erro ao buscar os prontuários do cliente.';
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
      ],
    });

    return data as MedicalRecordResponseDto;
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
        ...medicalRecordData
      } = updateMedicalRecordDto;
      const medicalRecord = await this.medicalRecordRepository.findOne({
        where: { id },
        relations: [
          'medicalRecordQuestions',
          'questions',
          'medicalRecordPathologies',
          'pathologies',
          'feedback',
          'client',
          'treatments',
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
          const medicalData = await manager.save(MedicalRecord, {
            ...medicalRecord,
            userId: auth?.id,
            clientId: newClient?.id,
          });

          let newPathologies = medicalRecord?.medicalRecordPathologies ?? [];
          let newTreatments = medicalRecord?.treatments ?? [];
          let newQuestions = medicalRecord?.medicalRecordQuestions ?? [];

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

          return {
            ...medicalData,
            client: newClient,
            medicalRecordPathologies: newPathologies,
            treatments: newTreatments,
            medicalRecordQuestions: newQuestions,
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

      await this.medicalRecordRepository.update(medicalRecord.id, {
        status: MedicalRecordStatusEnum.CANCELED,
      });
    } catch (error) {
      const message = 'Ocorreu um erro ao cancelar o prontuário o cliente.';

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
        'credentials',
        'calendarId',
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
}
