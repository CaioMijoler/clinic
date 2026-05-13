import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(SupabaseService.name);

  constructor(private readonly configService: ConfigService) {
    // Pega a URL e remove qualquer barra ou sufixo /rest/v1/ se existir
    const rawUrl = this.configService.get<string>('supabase.url');
    const supabaseUrl = rawUrl
      ?.replace(/\/rest\/v1\/?$/, '')
      .replace(/\/$/, '');

    // PARA O ADMIN FUNCIONAR: Esta chave PRECISA ser a "service_role" (sb_secret_...)
    const supabaseKey = this.configService.get<string>('supabase.key');

    if (!supabaseUrl || !supabaseKey) {
      this.logger.error('Supabase URL or Key is missing');
    } else {
      this.supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
      this.logger.log(`Supabase inicializado com sucesso em: ${supabaseUrl}`);
    }
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  async uploadFile(
    bucket: string,
    path: string,
    file: Buffer,
    contentType: string,
  ) {
    const cleanBucket = bucket.trim();
    const cleanPath = path.trim();

    const { data, error } = await this.supabase.storage
      .from(cleanBucket)
      .upload(cleanPath, file, {
        contentType,
        upsert: true,
      });

    if (error) {
      this.logger.error(`Error uploading file to Supabase: ${error.message}`);
      throw error;
    }

    const { data: signedUrlData, error: signedUrlError } =
      await this.supabase.storage
        .from(cleanBucket)
        .createSignedUrl(cleanPath, 60 * 60);

    if (signedUrlError) {
      this.logger.error(`Error creating signed URL: ${signedUrlError.message}`);
      throw signedUrlError;
    }

    return {
      path: data.path,
      signedUrl: signedUrlData.signedUrl,
    };
  }

  async getFile(bucket: string, path: string, expiresIn = 60 * 60) {
    const trimmedBucket = bucket.trim();
    const trimmedPath = path.trim();

    this.logger.debug(
      `[getFile] Gerando signed URL para bucket="${trimmedBucket}" path="${trimmedPath}"`,
    );

    const { data, error } = await this.supabase.storage
      .from(trimmedBucket)
      .createSignedUrl(trimmedPath, expiresIn);

    if (error) {
      this.logger.error(
        `[getFile] Erro ao gerar signed URL - bucket="${trimmedBucket}", path="${trimmedPath}", erro="${error.message}"`,
      );

      // Se o arquivo não existe, retorna erro mais descritivo
      if (error.message.includes('not found')) {
        throw new Error(`Arquivo não encontrado no storage: ${trimmedPath}`);
      }
      throw error;
    }

    if (!data?.signedUrl) {
      this.logger.error(
        `[getFile] Falha ao gerar URL assinada (signedUrl vazio) para: ${trimmedPath}`,
      );
      throw new Error(`Falha ao gerar URL assinada para: ${trimmedPath}`);
    }

    this.logger.debug(
      `[getFile] Signed URL gerada com sucesso para: ${trimmedPath}`,
    );
    return data.signedUrl;
  }

  async deleteFile(bucket: string, path: string) {
    const { error } = await this.supabase.storage
      .from(bucket.trim())
      .remove([path.trim()]);

    if (error) {
      this.logger.error(`Error deleting file from Supabase: ${error.message}`);
      throw error;
    }
  }
}
