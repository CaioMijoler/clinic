import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

/**
 * Cria a tabela appointments e move o modelo de agendamento para fora do medical_record.
 * Sem migração de dados (ambientes locais/produção ainda sem uso desse fluxo).
 */
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
