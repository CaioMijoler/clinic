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
  };

  return {
    env,
    logLevel,
    port: process.env.PORT ?? 3000,
    logInjection: process.env.LOG_INJECTION ?? true,
    calendar: {
      url: process.env.CALENDAR_URL
    },
    whatsapp: {
      url: process.env.WHATSAPP_URL,
      id: process.env.WHATSAPP_PHONE_NUMBER_ID,
      token: process.env.WHATSAPP_ACCESS_TOKEN,
    },
    database: {
      ...database,
    },
    auth: {
      provider: process.env.AUTH_PROVIDER ?? 'local',
      tokenTtl: process.env.AUTH_TOKEN_TTL || 86400,
      jwtSecret: process.env.JWT_SECRET ?? 'clinical',
    },
    supabase: {
      url: process.env.SUPABASE_URL,
      key: process.env.SUPABASE_KEY,
      bucket: process.env.SUPABASE_BUCKET ?? 'clinic-files',
    },
    redis: {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT) ?? 6379,
      password: process.env.REDIS_PASSWORD,
    },
    cripto: {
      alg: process.env.CRIPTO_ALG,
      secret: process.env.ENCRYPT_SECRET_KEY,
      iv: process.env.ENCRYPT_IV,
    },
  };
};
