import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class MedicalRecordDocuments1745914800000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "medical_record_documents",
            columns: [
                {
                    name: "id",
                    type: "int",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "increment"
                },
                {
                    name: "medical_record_id",
                    type: "int",
                },
                {
                    name: "name",
                    type: "varchar",
                    length: "255",
                },
                {
                    name: "path",
                    type: "text",
                },
                {
                    name: "content_type",
                    type: "varchar",
                    length: "100",
                },
                {
                    name: "created_at",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP"
                },
                {
                    name: "updated_at",
                    type: "timestamp",
                    default: "CURRENT_TIMESTAMP",
                    onUpdate: "CURRENT_TIMESTAMP"
                }
            ]
        }), true);

        await queryRunner.createForeignKey("medical_record_documents", new TableForeignKey({
            columnNames: ["medical_record_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "medical_record",
            onDelete: "CASCADE"
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("medical_record_documents");
        const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf("medical_record_id") !== -1);
        await queryRunner.dropForeignKey("medical_record_documents", foreignKey);
        await queryRunner.dropTable("medical_record_documents");
    }

}
