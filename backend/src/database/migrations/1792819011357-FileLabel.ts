import { MigrationInterface, QueryRunner } from 'typeorm';

export class FileLabel1792819011357 implements MigrationInterface {
  name = 'FileLabel1792819011357';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "files" ADD "label" character varying(40)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "files" DROP COLUMN "label"`);
  }
}
