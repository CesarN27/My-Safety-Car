import { MigrationInterface, QueryRunner } from 'typeorm';

export class SignatureAsStrokes1792818575602 implements MigrationInterface {
  name = 'SignatureAsStrokes1792818575602';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d7bbdb1f5ab46f7eb4ca9abe1a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" DROP CONSTRAINT "CHK_f048b5c8fdda990e23896673da"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shops" ADD "clauses" text NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(`ALTER TABLE "cars" ADD "signature" jsonb`);
    await queryRunner.query(
      `ALTER TABLE "cars" ADD "signedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(`ALTER TABLE "cars" ADD "signedClauses" text`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_79d72d1e3d518402a4c9ea96e9"`,
    );
    // Una firma guardada como imagen no se puede convertir en trazos: se conserva como foto de
    // entrada (no visible para el cliente) para no perder el archivo.
    await queryRunner.query(
      `UPDATE "files" SET "kind" = 'entrada', "visibleToClient" = false WHERE "kind" = 'firma'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."files_kind_enum" RENAME TO "files_kind_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."files_kind_enum" AS ENUM('entrada', 'pieza_danada', 'pieza_nueva', 'avance', 'ayudante', 'taller')`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ALTER COLUMN "kind" TYPE "public"."files_kind_enum" USING "kind"::"text"::"public"."files_kind_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."files_kind_enum_old"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_79d72d1e3d518402a4c9ea96e9" ON "files"  ("shopId", "kind") `,
    );
    await queryRunner.query(`ALTER TABLE "files" ADD CONSTRAINT "CHK_30c2388e4c0b5cc2e289ced2ac" CHECK (("kind" IN ('entrada', 'pieza_danada', 'pieza_nueva') AND "carId" IS NOT NULL AND "carLogId" IS NULL AND "helperId" IS NULL)
  OR ("kind" = 'avance' AND "carId" IS NOT NULL AND "carLogId" IS NOT NULL AND "helperId" IS NULL)
  OR ("kind" = 'ayudante' AND "helperId" IS NOT NULL AND "carId" IS NULL AND "carLogId" IS NULL)
  OR ("kind" = 'taller' AND "carId" IS NULL AND "carLogId" IS NULL AND "helperId" IS NULL))`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "files" DROP CONSTRAINT "CHK_30c2388e4c0b5cc2e289ced2ac"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_79d72d1e3d518402a4c9ea96e9"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."files_kind_enum_old" AS ENUM('entrada', 'pieza_danada', 'pieza_nueva', 'firma', 'avance', 'ayudante', 'taller')`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ALTER COLUMN "kind" TYPE "public"."files_kind_enum_old" USING "kind"::"text"::"public"."files_kind_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."files_kind_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."files_kind_enum_old" RENAME TO "files_kind_enum"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_79d72d1e3d518402a4c9ea96e9" ON "files" USING btree ("kind", "shopId") `,
    );
    await queryRunner.query(`ALTER TABLE "cars" DROP COLUMN "signedClauses"`);
    await queryRunner.query(`ALTER TABLE "cars" DROP COLUMN "signedAt"`);
    await queryRunner.query(`ALTER TABLE "cars" DROP COLUMN "signature"`);
    await queryRunner.query(`ALTER TABLE "shops" DROP COLUMN "clauses"`);
    await queryRunner.query(
      `ALTER TABLE "files" ADD CONSTRAINT "CHK_f048b5c8fdda990e23896673da" CHECK ((((kind = ANY (ARRAY['entrada'::files_kind_enum, 'pieza_danada'::files_kind_enum, 'pieza_nueva'::files_kind_enum, 'firma'::files_kind_enum])) AND ("carId" IS NOT NULL) AND ("carLogId" IS NULL) AND ("helperId" IS NULL)) OR ((kind = 'avance'::files_kind_enum) AND ("carId" IS NOT NULL) AND ("carLogId" IS NOT NULL) AND ("helperId" IS NULL)) OR ((kind = 'ayudante'::files_kind_enum) AND ("helperId" IS NOT NULL) AND ("carId" IS NULL) AND ("carLogId" IS NULL)) OR ((kind = 'taller'::files_kind_enum) AND ("carId" IS NULL) AND ("carLogId" IS NULL) AND ("helperId" IS NULL))))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_d7bbdb1f5ab46f7eb4ca9abe1a" ON "files" USING btree ("carId") WHERE (kind = 'firma'::files_kind_enum)`,
    );
  }
}
