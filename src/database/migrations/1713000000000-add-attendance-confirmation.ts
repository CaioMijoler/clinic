import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAttendanceConfirmation1713000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'medical_record',
      new TableColumn({
        name: 'attendance_status',
        type: 'enum',
        enum: ['PENDING', 'CONFIRMED', 'NO_SHOW'],
        default: "'PENDING'",
      }),
    );

    await queryRunner.addColumn(
      'medical_record',
      new TableColumn({
        name: 'confirmation_token',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'medical_record',
      new TableColumn({
        name: 'confirmed_at',
        type: 'timestamp',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('medical_record', 'confirmed_at');
    await queryRunner.dropColumn('medical_record', 'confirmation_token');
    await queryRunner.dropColumn('medical_record', 'attendance_status');
  }
}
