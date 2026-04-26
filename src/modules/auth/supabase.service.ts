import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(SupabaseService.name);

  constructor(private readonly configService: ConfigService) {
  // Pega a URL e remove qualquer barra ou sufixo /rest/v1/ se existir
  const rawUrl = this.configService.get<string>('SUPABASE_URL');
  const supabaseUrl = rawUrl?.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');

  // PARA O ADMIN FUNCIONAR: Esta chave PRECISA ser a "service_role" (sb_secret_...)
  const supabaseKey = this.configService.get<string>('SUPABASE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    this.logger.error('Supabase URL or Key is missing');
  } else {
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    this.logger.log(`Supabase inicializado com sucesso em: ${supabaseUrl}`);
  }
}

  getClient(): SupabaseClient {
    return this.supabase;
  }

  async uploadFile(bucket: string, path: string, file: Buffer, contentType: string) {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType,
        upsert: true,
      });

    if (error) {
      this.logger.error(`Error uploading file to Supabase: ${error.message}`);
      throw error;
    }

    const { data: publicUrlData } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return {
      path: data.path,
      publicUrl: publicUrlData.publicUrl,
    };
  }
}
