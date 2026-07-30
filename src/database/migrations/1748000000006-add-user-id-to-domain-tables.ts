import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

const TABLES = ['clients', 'pathologies', 'questions', 'treatment'];

/**
 * Adiciona `user_id` (nullable) em clients, pathologies, questions e treatment.
 * Nullable e sem backfill — registros existentes ficam sem dono até serem
 * vinculados manualmente.
 */
export class AddUserIdToDomainTables1748000000006
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const tableName of TABLES) {
      const table = await queryRunner.getTable(tableName);
      if (!table) {
        continue;
      }

      if (table.columns.some((column) => column.name === 'user_id')) {
        continue;
      }

      await queryRunner.addColumn(
        tableName,
        new TableColumn({
          name: 'user_id',
          type: 'int',
          isNullable: true,
        }),
      );

      await queryRunner.createForeignKey(
        tableName,
        new TableForeignKey({
          columnNames: ['user_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'users',
          onDelete: 'SET NULL',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const tableName of TABLES) {
      const table = await queryRunner.getTable(tableName);
      if (!table) {
        continue;
      }

      const foreignKey = table.foreignKeys.find((fk) =>
        fk.columnNames.includes('user_id'),
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey(tableName, foreignKey);
      }

      if (table.columns.some((column) => column.name === 'user_id')) {
        await queryRunner.dropColumn(tableName, 'user_id');
      }
    }
  }
}
