import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('upload')
@Controller('v1/upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post(':medicalRecordId')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFiles(
    @Param('medicalRecordId') medicalRecordId: string,
    @UploadedFiles() files: any[],
  ) {
    return this.uploadService.upload(Number(medicalRecordId), files);
  }

  @Get(':medicalRecordId/file/:documentId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Gera uma signed URL para acessar um documento do prontuário',
  })
  async getFile(
    @Param('medicalRecordId') medicalRecordId: string,
    @Param('documentId') documentId: string,
  ) {
    return this.uploadService.getFile(
      Number(medicalRecordId),
      Number(documentId),
    );
  }

  @Delete(':medicalRecordId/file/:documentId')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Remove um documento do prontuário',
  })
  async removeFile(
    @Param('medicalRecordId') medicalRecordId: string,
    @Param('documentId') documentId: string,
  ) {
    return this.uploadService.remove(
      Number(medicalRecordId),
      Number(documentId),
    );
  }
}
