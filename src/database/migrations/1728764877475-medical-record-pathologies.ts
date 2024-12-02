import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class MedicalRecordPathologies1728764877475
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'medical_record_pathologies',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'pathologies_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'medical_record_id',
            type: 'int',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'medical_record_pathologies',
      new TableForeignKey({
        columnNames: ['pathologies_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'pathologies',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'medical_record_pathologies',
      new TableForeignKey({
        columnNames: ['medical_record_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'medical_record',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('medical_record_pathologies');
  }
}
