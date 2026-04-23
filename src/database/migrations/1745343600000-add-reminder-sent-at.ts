import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddReminderSentAt1745343600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'medical_record',
      new TableColumn({
        name: 'reminder_sent_at',
        type: 'timestamp',
        isNullable: true,
        default: null,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('medical_record', 'reminder_sent_at');
  }
}
