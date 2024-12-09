import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class ClientAddress1733775454390 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'client_address',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'zip_code',
            type: 'varchar',
            length: '8',
            isNullable: true,
          },
          {
            name: 'client_id',
            type: 'int',
            isUnique: true,
          },
          {
            name: 'street',
            type: 'varchar',
            length: '70',
            isNullable: true,
          },
          {
            name: 'neighborhood',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'city',
            type: 'varchar',
            length: '30',
            isNullable: true,
          },
          {
            name: 'state',
            type: 'varchar',
            length: '2',
            isNullable: true,
          },
          {
            name: 'number',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'complement',
            type: 'varchar',
            length: '50',
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
      'client_address',
      new TableForeignKey({
        columnNames: ['client_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'clients',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('client_address');
  }
}
