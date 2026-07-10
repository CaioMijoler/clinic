import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

import { migrations } from './migrations';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          ...(configService.get('database') as TypeOrmModuleOptions),
          migrations,
          entities: [`${__dirname}/../modules/**/*.entity{.ts,.js}`],
          migrationsRun: true,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
