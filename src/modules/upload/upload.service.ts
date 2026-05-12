import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../auth/supabase.service';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { MedicalRecord } from '../medical-record/entities/medical-record.entity';
import { Repository } from 'typeorm';
import { MedicalRecordDocument } from '../medical-record/entities/medical-record-documents.entity';

@Injectable()
export class UploadService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
    @InjectRepository(MedicalRecord)
    private readonly medicalRecordRepository: Repository<MedicalRecord>,
    @InjectRepository(MedicalRecordDocument)
    private readonly medicalRecordDocumentRepository: Repository<MedicalRecordDocument>,
  ) {}

  async upload(medicalRecordId: number, files: any[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Nenhum arquivo enviado!');
    }
    const medicalRecord = await this.medicalRecordRepository.findOne({
      where: { id: medicalRecordId },
      relations: ['client'],
    });

    if (!medicalRecord) {
      throw new BadRequestException('Prontuário não encontrado!');
    }

    const bucket = this.configService.get<string>('supabase.bucket');
    const results = [];

    for (const file of files) {
      const fileName = `${Date.now()}-${file.originalname}`;
      const path = `uploads/${fileName}`;

      try {
        const result = await this.supabaseService.uploadFile(
          bucket,
          path,
          file.buffer,
          file.mimetype,
        );

        const document = this.medicalRecordDocumentRepository.create({
          medicalRecordId,
          name: file.originalname,
          path: result.path,
          contentType: file.mimetype,
        });

        const savedDocument =
          await this.medicalRecordDocumentRepository.save(document);

        results.push({
          ...savedDocument,
          signedUrl: result.signedUrl,
        });
      } catch (error) {
        throw new BadRequestException(
          `Erro ao fazer upload de ${file.originalname}: ${(error as Error).message}`,
        );
      }
    }

    return results;
  }

  async getFile(medicalRecordId: number, documentId: number) {
    const document = await this.medicalRecordDocumentRepository.findOne({
      where: { id: documentId, medicalRecordId },
    });

    if (!document) {
      throw new BadRequestException('Documento não encontrado!');
    }

    const bucket = this.configService.get<string>('supabase.bucket');
    const signedUrl = await this.supabaseService.getFile(bucket, document.path);

    return {
      id: document.id,
      name: document.name,
      contentType: document.contentType,
      signedUrl,
    };
  }

  async remove(medicalRecordId: number, documentId: number) {
    const document = await this.medicalRecordDocumentRepository.findOne({
      where: { id: documentId, medicalRecordId },
    });

    if (!document) {
      throw new BadRequestException('Documento não encontrado!');
    }

    const bucket = this.configService.get<string>('supabase.bucket');

    try {
      await this.supabaseService.deleteFile(bucket, document.path);
      await this.medicalRecordDocumentRepository.remove(document);
    } catch (error) {
      throw new BadRequestException(
        `Erro ao remover documento: ${(error as Error).message}`,
      );
    }
  }
}
