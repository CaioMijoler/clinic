import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

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
    const hasAttended = appointmentsTable?.columns.some(
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

    // Backfill: se o appointment tinha quantity_sessions > 1 e só 1 serviço, move o valor para o serviço
    await queryRunner.query(`
      UPDATE medical_record_services mrs
      INNER JOIN appointments a ON a.id = mrs.appointment_id
      INNER JOIN (
        SELECT appointment_id
        FROM medical_record_services
        WHERE appointment_id IS NOT NULL
        GROUP BY appointment_id
        HAVING COUNT(*) = 1
      ) single_service ON single_service.appointment_id = a.id
      SET mrs.quantity_sessions = a.quantity_sessions
      WHERE a.quantity_sessions > 1
    `);

    // Recalcula o total no appointment como soma dos serviços vinculados
    await queryRunner.query(`
      UPDATE appointments a
      INNER JOIN (
        SELECT appointment_id, COALESCE(SUM(quantity_sessions), 1) AS total_sessions
        FROM medical_record_services
        WHERE appointment_id IS NOT NULL
        GROUP BY appointment_id
      ) totals ON totals.appointment_id = a.id
      SET a.quantity_sessions = totals.total_sessions
    `);
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
