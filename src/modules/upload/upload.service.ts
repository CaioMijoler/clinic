import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../auth/supabase.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UploadService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
  ) {}

  async upload(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const bucket = this.configService.get<string>('supabase.bucket');
    const fileName = `${Date.now()}-${file.originalname}`;
    const path = `uploads/${fileName}`;

    try {
      const result = await this.supabaseService.uploadFile(
        bucket,
        path,
        file.buffer,
        file.mimetype,
      );

      return result;
    } catch (error) {
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }
}
