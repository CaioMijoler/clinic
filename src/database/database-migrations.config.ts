import { DataSource } from 'typeorm';

import * as dotenv from 'dotenv';
dotenv.config();

export default new DataSource({
  type: (process.env.DB_TYPE as any) ?? 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  username: process.env.DB_USER,
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
  ssl: {
    rejectUnauthorized: false,
  },
});
