import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateUserCredentials1745539600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'client_email',
        type: 'text',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'private_key',
        type: 'text',
        isNullable: true,
      }),
    );

    await queryRunner.dropColumn('users', 'credentials');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'credentials',
        type: 'json',
        isNullable: true,
      }),
    );

    await queryRunner.dropColumn('users', 'client_email');
    await queryRunner.dropColumn('users', 'private_key');
  }
}
