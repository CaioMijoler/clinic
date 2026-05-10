import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class Notification1746845668000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'notification',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'medical_record_id',
            type: 'int',
          },
          {
            name: 'user_id',
            type: 'int',
          },
          {
            name: 'read',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'notification',
      new TableForeignKey({
        columnNames: ['medical_record_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'medical_record',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'notification',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('notification');
  }
}
