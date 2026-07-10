import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

/**
 * Garante a coluna notification.user_id (schema only).
 * Sem backfill — produção ainda sem uso desse fluxo.
 */
export class EnsureNotificationUserId1748000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const notificationTable = await queryRunner.getTable('notification');
    if (!notificationTable) {
      return;
    }

    const hasUserId = notificationTable.columns.some(
      (column) => column.name === 'user_id',
    );

    if (hasUserId) {
      return;
    }

    await queryRunner.addColumn(
      'notification',
      new TableColumn({
        name: 'user_id',
        type: 'int',
        isNullable: true,
      }),
    );

    await queryRunner.createForeignKey(
      'notification',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const notificationTable = await queryRunner.getTable('notification');
    if (!notificationTable) {
      return;
    }

    const foreignKey = notificationTable.foreignKeys.find((fk) =>
      fk.columnNames.includes('user_id'),
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('notification', foreignKey);
    }

    if (notificationTable.columns.some((column) => column.name === 'user_id')) {
      await queryRunner.dropColumn('notification', 'user_id');
    }
  }
}
