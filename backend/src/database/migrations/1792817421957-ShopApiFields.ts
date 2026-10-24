import { MigrationInterface, QueryRunner } from 'typeorm';

export class ShopApiFields1792817421957 implements MigrationInterface {
  name = 'ShopApiFields1792817421957';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cars" DROP CONSTRAINT "FK_0cceaf5ff00107ae8b7f83fff89"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shops" ADD "nextFolio" integer NOT NULL DEFAULT '1'`,
    );
    await queryRunner.query(
      `ALTER TABLE "shops" ADD "ivaPct" numeric(5,2) NOT NULL DEFAULT '16'`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_items" ADD "qty" numeric(10,2) NOT NULL DEFAULT '1'`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_items" ADD "position" smallint NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "cars" ADD "clientDescription" character varying NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(`ALTER TABLE "car_logs" ADD "fromState" smallint`);
    await queryRunner.query(
      `ALTER TABLE "cars" ALTER COLUMN "ivaOn" SET DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "shops" ADD CONSTRAINT "CHK_6194c2df25e293704ff9484f42" CHECK ("nextFolio" > 0)`,
    );
    await queryRunner.query(
      `ALTER TABLE "shops" ADD CONSTRAINT "CHK_cd570182eadc0ecb56772a95c4" CHECK ("ivaPct" BETWEEN 0 AND 100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_items" ADD CONSTRAINT "CHK_a5afe2aa48a3515c86159b8dbf" CHECK ("qty" > 0)`,
    );
    await queryRunner.query(
      `ALTER TABLE "car_logs" ADD CONSTRAINT "CHK_263ba1bcee0fdb6a64458e3eb4" CHECK ("fromState" BETWEEN 0 AND 5)`,
    );
    // El consecutivo sigue después del folio numérico más alto que ya tenga cada taller.
    await queryRunner.query(
      `UPDATE "shops" s SET "nextFolio" = 1 + COALESCE((SELECT MAX("folio"::int) FROM "cars" c WHERE c."shopId" = s."id" AND c."folio" ~ '^[0-9]{1,9}$'), 0)`,
    );
    // Coches con un ayudante de otro taller (antes nada lo impedía): se quedan sin asignar.
    await queryRunner.query(
      `UPDATE "cars" c SET "helperId" = NULL WHERE "helperId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "helpers" h WHERE h."id" = c."helperId" AND h."shopId" = c."shopId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "cars" ADD CONSTRAINT "FK_feb4df8cad9c3f1a803a05b6643" FOREIGN KEY ("helperId", "shopId") REFERENCES "helpers"("id","shopId") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cars" DROP CONSTRAINT "FK_feb4df8cad9c3f1a803a05b6643"`,
    );
    await queryRunner.query(
      `ALTER TABLE "car_logs" DROP CONSTRAINT "CHK_263ba1bcee0fdb6a64458e3eb4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_items" DROP CONSTRAINT "CHK_a5afe2aa48a3515c86159b8dbf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shops" DROP CONSTRAINT "CHK_cd570182eadc0ecb56772a95c4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shops" DROP CONSTRAINT "CHK_6194c2df25e293704ff9484f42"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cars" ALTER COLUMN "ivaOn" SET DEFAULT false`,
    );
    await queryRunner.query(`ALTER TABLE "car_logs" DROP COLUMN "fromState"`);
    await queryRunner.query(
      `ALTER TABLE "cars" DROP COLUMN "clientDescription"`,
    );
    await queryRunner.query(`ALTER TABLE "cost_items" DROP COLUMN "position"`);
    await queryRunner.query(`ALTER TABLE "cost_items" DROP COLUMN "qty"`);
    await queryRunner.query(`ALTER TABLE "shops" DROP COLUMN "ivaPct"`);
    await queryRunner.query(`ALTER TABLE "shops" DROP COLUMN "nextFolio"`);
    await queryRunner.query(
      `ALTER TABLE "cars" ADD CONSTRAINT "FK_0cceaf5ff00107ae8b7f83fff89" FOREIGN KEY ("helperId") REFERENCES "helpers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }
}
