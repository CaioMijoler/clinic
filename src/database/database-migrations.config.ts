import { DataSource } from 'typeorm';

export default async () => {
  return new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    username: process.env.DB_USER,
    migrations: [`${__dirname}/migrations/*{.ts,.js}`],
  });
};
