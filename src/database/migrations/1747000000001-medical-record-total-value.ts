import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class MedicalRecordTotalValue1747000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const medicalRecordTable = await queryRunner.getTable('medical_record');

    if (medicalRecordTable && !medicalRecordTable.findColumnByName('total_value')) {
      await queryRunner.addColumn(
        'medical_record',
        new TableColumn({
          name: 'total_value',
          type: 'decimal',
          precision: 10,
          scale: 2,
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const medicalRecordTable = await queryRunner.getTable('medical_record');

    if (medicalRecordTable?.findColumnByName('total_value')) {
      await queryRunner.dropColumn('medical_record', 'total_value');
    }
  }
}
