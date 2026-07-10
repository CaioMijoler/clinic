import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

const APPOINTMENT_STATUSES = new Set([
  'created',
  'scheduled',
  'confirmed_schedule',
  'in_progress',
  'concluded',
  'canceled',
  'canceled_schedule',
]);

function mapTreatmentStatus(
  oldStatus: string | null,
  hasConclusion: boolean,
): string {
  if (hasConclusion || oldStatus === 'concluded') {
    return 'finished';
  }

  if (oldStatus === 'in_progress') {
    return 'in_progress';
  }

  if (oldStatus === 'canceled') {
    return 'finished';
  }

  return 'pending';
}

export class AppointmentsAndMedicalRecordRefactor1748000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasAppointments = await queryRunner.hasTable('appointments');

    if (!hasAppointments) {
      await queryRunner.createTable(
        new Table({
          name: 'appointments',
          columns: [
            {
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            { name: 'medical_record_id', type: 'int' },
            { name: 'user_id', type: 'int' },
            { name: 'start_date', type: 'timestamp' },
            { name: 'end_date', type: 'timestamp' },
            { name: 'status', type: 'varchar', length: '255' },
            {
              name: 'quantity_sessions',
              type: 'int',
              default: 1,
            },
            {
              name: 'title',
              type: 'varchar',
              length: '255',
              isNullable: true,
            },
            {
              name: 'total_value',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: true,
            },
            {
              name: 'confirmation_token',
              type: 'varchar',
              length: '255',
              isNullable: true,
            },
            {
              name: 'confirmed_at',
              type: 'timestamp',
              isNullable: true,
            },
            {
              name: 'reminder_sent_at',
              type: 'timestamp',
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

      await queryRunner.createForeignKey(
        'appointments',
        new TableForeignKey({
          columnNames: ['medical_record_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'medical_record',
          onDelete: 'CASCADE',
        }),
      );

      await queryRunner.createForeignKey(
        'appointments',
        new TableForeignKey({
          columnNames: ['user_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'users',
          onDelete: 'CASCADE',
        }),
      );
    }

    const servicesTable = await queryRunner.getTable('medical_record_services');
    if (
      servicesTable &&
      !servicesTable.columns.some((column) => column.name === 'appointment_id')
    ) {
      await queryRunner.addColumn(
        'medical_record_services',
        new TableColumn({
          name: 'appointment_id',
          type: 'int',
          isNullable: true,
        }),
      );

      await queryRunner.createForeignKey(
        'medical_record_services',
        new TableForeignKey({
          columnNames: ['appointment_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'appointments',
          onDelete: 'SET NULL',
        }),
      );
    }

    const medicalRecordTable = await queryRunner.getTable('medical_record');
    const hasStartDate = medicalRecordTable?.columns.some(
      (column) => column.name === 'start_date',
    );

    if (hasStartDate) {
      const scheduledRecords: Array<{
        id: number;
        user_id: number;
        start_date: Date;
        end_date: Date;
        status: string;
        title: string | null;
        total_value: string | null;
        confirmation_token: string | null;
        confirmed_at: Date | null;
        reminder_sent_at: Date | null;
        conclusion: string | null;
      }> = await queryRunner.query(`
        SELECT id, user_id, start_date, end_date, status, title, total_value,
               confirmation_token, confirmed_at, reminder_sent_at, conclusion
        FROM medical_record
        WHERE start_date IS NOT NULL
      `);

      for (const record of scheduledRecords) {
        const appointmentStatus = APPOINTMENT_STATUSES.has(record.status)
          ? record.status
          : 'created';

        const existingAppointment = await queryRunner.query(
          `SELECT id FROM appointments WHERE medical_record_id = ? AND start_date = ? LIMIT 1`,
          [record.id, record.start_date],
        );

        let appointmentId = existingAppointment[0]?.id as number | undefined;

        if (!appointmentId) {
          const insertResult = await queryRunner.query(
            `
            INSERT INTO appointments (
              medical_record_id, user_id, start_date, end_date, status,
              quantity_sessions, title, total_value, confirmation_token,
              confirmed_at, reminder_sent_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, NOW(), NOW())
          `,
            [
              record.id,
              record.user_id,
              record.start_date,
              record.end_date,
              appointmentStatus,
              record.title,
              record.total_value,
              record.confirmation_token,
              record.confirmed_at,
              record.reminder_sent_at,
            ],
          );

          appointmentId =
            insertResult.insertId ??
            (
              await queryRunner.query(
                `SELECT id FROM appointments WHERE medical_record_id = ? AND start_date = ? ORDER BY id DESC LIMIT 1`,
                [record.id, record.start_date],
              )
            )[0]?.id;
        }

        if (appointmentId) {
          await queryRunner.query(
            `UPDATE medical_record_services SET appointment_id = ? WHERE medical_record_id = ? AND appointment_id IS NULL`,
            [appointmentId, record.id],
          );
        }

        const treatmentStatus = mapTreatmentStatus(
          record.status,
          Boolean(record.conclusion?.trim()),
        );

        await queryRunner.query(
          `UPDATE medical_record SET status = ? WHERE id = ?`,
          [treatmentStatus, record.id],
        );
      }

      const recordsWithoutSchedule: Array<{
        id: number;
        status: string;
        conclusion: string | null;
      }> = await queryRunner.query(`
        SELECT id, status, conclusion
        FROM medical_record
        WHERE start_date IS NULL
      `);

      for (const record of recordsWithoutSchedule) {
        const treatmentStatus = mapTreatmentStatus(
          record.status,
          Boolean(record.conclusion?.trim()),
        );

        await queryRunner.query(
          `UPDATE medical_record SET status = ? WHERE id = ?`,
          [treatmentStatus, record.id],
        );
      }

      const columnsToDrop = [
        'start_date',
        'end_date',
        'confirmation_token',
        'confirmed_at',
        'reminder_sent_at',
        'attendance_status',
      ];

      for (const columnName of columnsToDrop) {
        if (medicalRecordTable?.columns.some((column) => column.name === columnName)) {
          await queryRunner.dropColumn('medical_record', columnName);
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const medicalRecordTable = await queryRunner.getTable('medical_record');

    if (
      medicalRecordTable &&
      !medicalRecordTable.columns.some((column) => column.name === 'start_date')
    ) {
      await queryRunner.addColumn(
        'medical_record',
        new TableColumn({
          name: 'start_date',
          type: 'timestamp',
          isNullable: true,
        }),
      );
      await queryRunner.addColumn(
        'medical_record',
        new TableColumn({
          name: 'end_date',
          type: 'timestamp',
          isNullable: true,
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
      await queryRunner.addColumn(
        'medical_record',
        new TableColumn({
          name: 'reminder_sent_at',
          type: 'timestamp',
          isNullable: true,
        }),
      );

      const appointments: Array<{
        medical_record_id: number;
        start_date: Date;
        end_date: Date;
        status: string;
        title: string | null;
        total_value: string | null;
        confirmation_token: string | null;
        confirmed_at: Date | null;
        reminder_sent_at: Date | null;
      }> = await queryRunner.query(`
        SELECT medical_record_id, start_date, end_date, status, title, total_value,
               confirmation_token, confirmed_at, reminder_sent_at
        FROM appointments
        ORDER BY id ASC
      `);

      for (const appointment of appointments) {
        await queryRunner.query(
          `
          UPDATE medical_record
          SET start_date = ?, end_date = ?, status = ?, title = ?, total_value = ?,
              confirmation_token = ?, confirmed_at = ?, reminder_sent_at = ?
          WHERE id = ?
        `,
          [
            appointment.start_date,
            appointment.end_date,
            appointment.status,
            appointment.title,
            appointment.total_value,
            appointment.confirmation_token,
            appointment.confirmed_at,
            appointment.reminder_sent_at,
            appointment.medical_record_id,
          ],
        );
      }
    }

    const servicesTable = await queryRunner.getTable('medical_record_services');
    if (
      servicesTable?.columns.some((column) => column.name === 'appointment_id')
    ) {
      const foreignKey = servicesTable.foreignKeys.find((fk) =>
        fk.columnNames.includes('appointment_id'),
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('medical_record_services', foreignKey);
      }
      await queryRunner.dropColumn('medical_record_services', 'appointment_id');
    }

    if (await queryRunner.hasTable('appointments')) {
      await queryRunner.dropTable('appointments');
    }
  }
}
