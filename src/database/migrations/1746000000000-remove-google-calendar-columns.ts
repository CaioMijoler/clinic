import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class RemoveGoogleCalendarColumns1746000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const userTable = await queryRunner.getTable('users');
    if (userTable) {
      if (userTable.findColumnByName('client_email')) {
        await queryRunner.dropColumn('users', 'client_email');
      }
      if (userTable.findColumnByName('private_key')) {
        await queryRunner.dropColumn('users', 'private_key');
      }
      if (userTable.findColumnByName('calendar_id')) {
        await queryRunner.dropColumn('users', 'calendar_id');
      }
    }

    const medicalRecordTable = await queryRunner.getTable('medical_record');
    if (medicalRecordTable) {
      if (medicalRecordTable.findColumnByName('calendar_google_id')) {
        await queryRunner.dropColumn('medical_record', 'calendar_google_id');
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const userTable = await queryRunner.getTable('users');
    if (userTable) {
      if (!userTable.findColumnByName('client_email')) {
        await queryRunner.addColumn('users', new TableColumn({
          name: 'client_email',
          type: 'text',
          isNullable: true,
        }));
      }
      if (!userTable.findColumnByName('private_key')) {
        await queryRunner.addColumn('users', new TableColumn({
          name: 'private_key',
          type: 'text',
          isNullable: true,
        }));
      }
      if (!userTable.findColumnByName('calendar_id')) {
        await queryRunner.addColumn('users', new TableColumn({
          name: 'calendar_id',
          type: 'text',
          isNullable: true,
        }));
      }
    }

    const medicalRecordTable = await queryRunner.getTable('medical_record');
    if (medicalRecordTable) {
      if (!medicalRecordTable.findColumnByName('calendar_google_id')) {
        await queryRunner.addColumn('medical_record', new TableColumn({
          name: 'calendar_google_id',
          type: 'text',
          isNullable: true,
        }));
      }
    }
  }
}
