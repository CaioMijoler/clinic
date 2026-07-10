import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class DropAttendanceStatusFromMedicalRecord1748000000002
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const medicalRecordTable = await queryRunner.getTable('medical_record');
    const hasAttendanceStatus = medicalRecordTable?.columns.some(
      (column) => column.name === 'attendance_status',
    );

    if (hasAttendanceStatus) {
      await queryRunner.dropColumn('medical_record', 'attendance_status');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const medicalRecordTable = await queryRunner.getTable('medical_record');
    const hasAttendanceStatus = medicalRecordTable?.columns.some(
      (column) => column.name === 'attendance_status',
    );

    if (!hasAttendanceStatus) {
      await queryRunner.addColumn(
        'medical_record',
        new TableColumn({
          name: 'attendance_status',
          type: 'varchar',
          length: '255',
          isNullable: true,
          default: "'PENDING'",
        }),
      );
    }
  }
}
