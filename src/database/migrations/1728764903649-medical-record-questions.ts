import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class MedicalRecordQuestions1728764903649 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'medical_record_questions',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'question_id',
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
      'medical_record_questions',
      new TableForeignKey({
        columnNames: ['question_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'questions',
      }),
    );

    await queryRunner.createForeignKey(
      'medical_record_questions',
      new TableForeignKey({
        columnNames: ['medical_record_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'medical_record',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('medical_record_questions');
  }
}
