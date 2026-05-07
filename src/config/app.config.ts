export default () => {
  const env = process.env.ENV ?? 'dev';
  const logLevel = process.env.LOG_LEVEL ?? 'debug';

  const database = {
    type: (process.env.DB_TYPE as any) ?? 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    username: process.env.DB_USER,
    logging: logLevel === 'debug',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    poolSize: 5,
    extra: {
      max: 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
    },
  };

  return {
    env,
    logLevel,
    port: process.env.PORT ?? 3000,
    logInjection: process.env.LOG_INJECTION ?? true,
    whatsapp: {
      url: process.env.WHATSAPP_URL,
    },
    database: {
      ...database,
    },
    auth: {
      provider: process.env.AUTH_PROVIDER ?? 'local',
      tokenTtl: process.env.AUTH_TOKEN_TTL || 86400,
    },
    supabase: {
      url: process.env.SUPABASE_URL,
      key: process.env.SUPABASE_KEY,
      bucket: process.env.SUPABASE_BUCKET ?? 'clinic-files',
    },
    redis: {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
      password: process.env.REDIS_PASSWORD,
    },
    cripto: {
      alg: process.env.CRIPTO_ALG || 'aes-256-ctr',
      secret: process.env.ENCRYPT_SECRET_KEY,
      iv: process.env.ENCRYPT_IV,
    },
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    cronSecret: process.env.CRON_SECRET,
  };
};
