import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class Users1714602960508 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'password',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'document',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'telephone',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'calendar_id',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'whatsapp_token',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'whatsapp_id',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'token',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}
