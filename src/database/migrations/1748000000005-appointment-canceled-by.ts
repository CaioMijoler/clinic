import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AppointmentCanceledBy1748000000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const appointmentsTable = await queryRunner.getTable('appointments');
    if (!appointmentsTable) {
      return;
    }

    const hasCanceledBy = appointmentsTable.columns.some(
      (column) => column.name === 'canceled_by',
    );

    if (!hasCanceledBy) {
      await queryRunner.addColumn(
        'appointments',
        new TableColumn({
          name: 'canceled_by',
          type: 'varchar',
          length: '50',
          isNullable: true,
          default: null,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const appointmentsTable = await queryRunner.getTable('appointments');
    if (
      appointmentsTable?.columns.some((column) => column.name === 'canceled_by')
    ) {
      await queryRunner.dropColumn('appointments', 'canceled_by');
    }
  }
}
