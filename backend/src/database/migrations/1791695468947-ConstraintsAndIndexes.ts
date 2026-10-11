import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConstraintsAndIndexes1791695468947 implements MigrationInterface {
  name = 'ConstraintsAndIndexes1791695468947';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7c66fb5f9c3bd032eefbe9a7d5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cars" ADD "deliveredAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "cars" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9bce005e9b5501d136eaae7c54" ON "cars"  ("shopId", "state") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_2d00eeaf24d487a6945ea8fa0b" ON "cars"  ("shopId", "folio") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e790064d62d98fcbfe9e973b6e" ON "car_logs"  ("carId", "at") `,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "CHK_a90033c46dc26973a9807ccc41" CHECK (("role" IN ('taller', 'ayudante') AND "shopId" IS NOT NULL) OR ("role" IN ('admin', 'cliente') AND "shopId" IS NULL))`,
    );
    await queryRunner.query(
      `ALTER TABLE "helpers" ADD CONSTRAINT "CHK_4dfa6a5c76f71e47c179d50300" CHECK (("payType" = 'fijo' AND "payAmount" IS NOT NULL AND "payAmount" >= 0) OR ("payType" = 'porcentaje' AND "payPct" IS NOT NULL AND "payPct" BETWEEN 0 AND 100))`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_items" ADD CONSTRAINT "CHK_f8ccc108cc3535ca159f812558" CHECK ("price" >= 0)`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_items" ADD CONSTRAINT "CHK_5736a34d2ef7f0959e529236b2" CHECK ("cost" >= 0)`,
    );
    await queryRunner.query(
      `ALTER TABLE "cars" ADD CONSTRAINT "CHK_5ab77641c2559234b8912bea0e" CHECK ("fuel" BETWEEN 0 AND 1)`,
    );
    await queryRunner.query(
      `ALTER TABLE "cars" ADD CONSTRAINT "CHK_cc63f6cd705d928289670d3970" CHECK ("state" BETWEEN 0 AND 5)`,
    );
    await queryRunner.query(
      `ALTER TABLE "car_logs" ADD CONSTRAINT "CHK_626791b9e3da0515794400a472" CHECK ("state" BETWEEN 0 AND 5)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "car_logs" DROP CONSTRAINT "CHK_626791b9e3da0515794400a472"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cars" DROP CONSTRAINT "CHK_cc63f6cd705d928289670d3970"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cars" DROP CONSTRAINT "CHK_5ab77641c2559234b8912bea0e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_items" DROP CONSTRAINT "CHK_5736a34d2ef7f0959e529236b2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_items" DROP CONSTRAINT "CHK_f8ccc108cc3535ca159f812558"`,
    );
    await queryRunner.query(
      `ALTER TABLE "helpers" DROP CONSTRAINT "CHK_4dfa6a5c76f71e47c179d50300"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "CHK_a90033c46dc26973a9807ccc41"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e790064d62d98fcbfe9e973b6e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2d00eeaf24d487a6945ea8fa0b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9bce005e9b5501d136eaae7c54"`,
    );
    await queryRunner.query(`ALTER TABLE "cars" DROP COLUMN "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "cars" DROP COLUMN "deliveredAt"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_7c66fb5f9c3bd032eefbe9a7d5" ON "cars" USING btree ("folio") `,
    );
  }
}
