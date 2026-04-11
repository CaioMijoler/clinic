export default () => {
  const env = process.env.ENV ?? 'dev';
  const logLevel = process.env.LOG_LEVEL ?? 'debug';

  const database = {
    type: 'mysql',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    username: process.env.DB_USER,
    logging: logLevel === 'debug',
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
    cripto: {
      alg: process.env.CRIPTO_ALG,
      secret: process.env.ENCRYPT_SECRET_KEY,
      iv: process.env.ENCRYPT_IV,
    },
  };
};
