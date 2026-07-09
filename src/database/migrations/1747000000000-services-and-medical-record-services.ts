import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class ServicesAndMedicalRecordServices1747000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasOldTable = await queryRunner.hasTable('medical_services');
    const hasServicesTable = await queryRunner.hasTable('services');

    if (hasOldTable && !hasServicesTable) {
      await queryRunner.renameTable('medical_services', 'services');
    } else if (!hasServicesTable) {
      await queryRunner.createTable(
        new Table({
          name: 'services',
          columns: [
            {
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            {
              name: 'name',
              type: 'varchar',
              length: '255',
            },
            {
              name: 'active',
              type: 'boolean',
              default: true,
            },
            {
              name: 'duration_minutes',
              type: 'int',
            },
            {
              name: 'price',
              type: 'decimal',
              precision: 10,
              scale: 2,
              default: 0,
            },
            {
              name: 'user_id',
              type: 'int',
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
        'services',
        new TableForeignKey({
          columnNames: ['user_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'users',
          onDelete: 'CASCADE',
        }),
      );
    } else {
      const servicesTable = await queryRunner.getTable('services');

      if (servicesTable && !servicesTable.findColumnByName('price')) {
        await queryRunner.addColumn(
          'services',
          new TableColumn({
            name: 'price',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          }),
        );
      }
    }

    const hasMedicalRecordServices = await queryRunner.hasTable(
      'medical_record_services',
    );

    if (!hasMedicalRecordServices) {
      await queryRunner.createTable(
        new Table({
          name: 'medical_record_services',
          columns: [
            {
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            },
            {
              name: 'medical_record_id',
              type: 'int',
            },
            {
              name: 'service_id',
              type: 'int',
            },
            {
              name: 'duration_minutes',
              type: 'int',
            },
            {
              name: 'total_value',
              type: 'decimal',
              precision: 10,
              scale: 2,
              default: 0,
            },
            {
              name: 'courtesy',
              type: 'boolean',
              default: false,
            },
            {
              name: 'discount',
              type: 'decimal',
              precision: 10,
              scale: 2,
              default: 0,
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
        'medical_record_services',
        new TableForeignKey({
          columnNames: ['medical_record_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'medical_record',
          onDelete: 'CASCADE',
        }),
      );

      await queryRunner.createForeignKey(
        'medical_record_services',
        new TableForeignKey({
          columnNames: ['service_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'services',
          onDelete: 'RESTRICT',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const medicalRecordServicesTable = await queryRunner.getTable(
      'medical_record_services',
    );

    if (medicalRecordServicesTable) {
      for (const foreignKey of medicalRecordServicesTable.foreignKeys) {
        await queryRunner.dropForeignKey('medical_record_services', foreignKey);
      }
      await queryRunner.dropTable('medical_record_services');
    }

    const servicesTable = await queryRunner.getTable('services');

    if (servicesTable) {
      for (const foreignKey of servicesTable.foreignKeys) {
        await queryRunner.dropForeignKey('services', foreignKey);
      }
      await queryRunner.dropTable('services');
    }
  }
}
