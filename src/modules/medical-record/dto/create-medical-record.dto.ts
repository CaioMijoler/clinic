import { CreateClientDto } from '../../../modules/clients/dto/create-client.dto';
import { CreateFeedbackDto } from '../../../modules/feedback/dto/create-feedback.dto';
import { CreatePathologyDto } from '../../../modules/pathologies/dto/create-pathology.dto';
import { CreateQuestionDto } from '../../../modules/questions/dto/create-question.dto';
import { CreateTreatmentDto } from '../../../modules/treatment/dto/create-treatment.dto';
import { ErrorMessages } from '../../../utils/error-message';
import { MedicalRecordStatusEnum } from '../../../utils/enum/medical-record.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDefined,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CreateMedicalRecordPathologyDto } from './medical-record-pathologies/create-medical-record-pathologies.dto';
import { CreateMedicalRecordQuestionsDto } from './medical-record-questions/create-medical-record-questions.dto';

export class CreateMedicalRecordDto {
  @ApiProperty()
  @IsString({ message: ErrorMessages['string.base']('Sintomas') })
  @Length(1, 500, {
    message: ErrorMessages['length']('Sintomas', 1, 500),
  })
  symptoms: string;
  @ApiProperty()
  @IsString({ message: ErrorMessages['string.base']('Exame clínico') })
  @Length(1, 500, {
    message: ErrorMessages['length']('Exame clínico', 1, 500),
  })
  clinicalExam: string;

  @ApiProperty()
  @IsString({ message: ErrorMessages['string.base']('Exame clínico completo') })
  @Length(1, 1000, {
    message: ErrorMessages['length']('Exame clínico completo', 1, 1000),
  })
  completeClinicalExam: string;

  @ApiProperty()
  @IsString({
    message: ErrorMessages['string.base']('Conclusão do prontuário'),
  })
  @MaxLength(1000, {
    message: ErrorMessages['string.max']('Conclusão', 1000),
  })
  @IsOptional()
  conclusion: string;

  @ApiProperty()
  @IsNumber({}, { message: ErrorMessages['number.base']('Id do cliente') })
  @IsOptional()
  clientId: number;

  @ApiProperty()
  @IsOptional()
  userId: number;

  @ApiProperty({ enum: MedicalRecordStatusEnum })
  @IsOptional()
  @IsEnum(MedicalRecordStatusEnum, {
    message: ErrorMessages['string.base']('Status do prontuário'),
  })
  status?: MedicalRecordStatusEnum;

  @ApiProperty()
  @Type(() => CreateClientDto)
  @IsOptional()
  @IsDefined({ message: ErrorMessages['empty']('Paciente do prontuário') })
  @ValidateNested()
  client: CreateClientDto;

  @ApiProperty({ type: CreateMedicalRecordPathologyDto, isArray: true })
  @Type(() => CreateMedicalRecordPathologyDto)
  @IsOptional()
  @IsDefined({ message: ErrorMessages['empty']('Patologias do prontuário') })
  @ValidateNested()
  medicalRecordPathologies?: CreateMedicalRecordPathologyDto[];

  @ApiProperty({ type: CreateMedicalRecordQuestionsDto, isArray: true })
  @Type(() => CreateMedicalRecordQuestionsDto)
  @IsOptional()
  @IsDefined({
    message: ErrorMessages['empty']('Guia de perguntas do prontuário'),
  })
  @ValidateNested()
  medicalRecordQuestions?: CreateMedicalRecordQuestionsDto[];

  @ApiProperty({ type: CreateTreatmentDto, isArray: true })
  @Type(() => CreateTreatmentDto)
  @IsOptional()
  @IsDefined({ message: ErrorMessages['empty']('Tratamentos do prontuário') })
  @ValidateNested()
  treatments?: CreateTreatmentDto[];

  @ApiProperty({ type: CreateFeedbackDto, isArray: true })
  @Type(() => CreateFeedbackDto)
  @IsOptional()
  @IsDefined({ message: ErrorMessages['empty']('Feedbacks do prontuário') })
  @ValidateNested()
  feedbacks?: CreateFeedbackDto[];
}

export class MedicalRecordResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  symptoms: string;

  @ApiProperty()
  clinicalExam: string;

  @ApiProperty()
  completeClinicalExam: string;

  @ApiProperty()
  conclusion: string;

  @ApiProperty()
  clientId: number;

  @ApiProperty()
  userId: number;

  @ApiProperty({ enum: MedicalRecordStatusEnum })
  @IsOptional()
  status?: MedicalRecordStatusEnum;

  @ApiProperty()
  client: CreateClientDto;

  @ApiProperty({ type: CreateMedicalRecordPathologyDto, isArray: true })
  medicalRecordPathologies?: CreateMedicalRecordPathologyDto[];

  @ApiProperty({ type: CreateMedicalRecordQuestionsDto, isArray: true })
  medicalRecordQuestions?: CreateMedicalRecordQuestionsDto[];

  @ApiProperty({ type: CreatePathologyDto, isArray: true })
  pathologies?: CreatePathologyDto[];

  @ApiProperty({ type: CreateQuestionDto, isArray: true })
  questions?: CreateQuestionDto[];

  @ApiProperty({ type: CreateTreatmentDto, isArray: true })
  treatments?: CreateTreatmentDto[];

  @ApiProperty({ type: CreateFeedbackDto, isArray: true })
  @IsOptional()
  feedbacks?: CreateFeedbackDto[];

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
