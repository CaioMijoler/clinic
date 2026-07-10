import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Adiciona quantity_sessions por serviço e attended no appointment.
 * Sem backfill de dados.
 */
export class ServiceQuantitySessionsAndAppointmentAttended1748000000003
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const servicesTable = await queryRunner.getTable('medical_record_services');
    const hasQuantitySessions = servicesTable?.columns.some(
      (column) => column.name === 'quantity_sessions',
    );

    if (!hasQuantitySessions) {
      await queryRunner.addColumn(
        'medical_record_services',
        new TableColumn({
          name: 'quantity_sessions',
          type: 'int',
          default: 1,
          isNullable: false,
        }),
      );
    }

    const appointmentsTable = await queryRunner.getTable('appointments');
    if (!appointmentsTable) {
      return;
    }

    const hasAttended = appointmentsTable.columns.some(
      (column) => column.name === 'attended',
    );

    if (!hasAttended) {
      await queryRunner.addColumn(
        'appointments',
        new TableColumn({
          name: 'attended',
          type: 'boolean',
          isNullable: true,
          default: null,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const appointmentsTable = await queryRunner.getTable('appointments');
    if (appointmentsTable?.columns.some((column) => column.name === 'attended')) {
      await queryRunner.dropColumn('appointments', 'attended');
    }

    const servicesTable = await queryRunner.getTable('medical_record_services');
    if (
      servicesTable?.columns.some((column) => column.name === 'quantity_sessions')
    ) {
      await queryRunner.dropColumn('medical_record_services', 'quantity_sessions');
    }
  }
}
