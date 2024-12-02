import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          ...(configService.get('database') as TypeOrmModuleOptions),
          migrations: [`${__dirname}/migrations/*{.ts,.js}`],
          entities: [`${__dirname}'/../modules/**/*.entity{.ts,.js}`],
          migrationsRun: true,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
