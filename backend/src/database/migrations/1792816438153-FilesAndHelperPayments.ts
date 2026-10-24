import { MigrationInterface, QueryRunner } from 'typeorm';

export class FilesAndHelperPayments1792816438153 implements MigrationInterface {
  name = 'FilesAndHelperPayments1792816438153';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."files_kind_enum" AS ENUM('entrada', 'pieza_danada', 'pieza_nueva', 'firma', 'avance', 'ayudante', 'taller')`,
    );
    await queryRunner.query(`CREATE TABLE "files" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "shopId" uuid NOT NULL, "kind" "public"."files_kind_enum" NOT NULL, "carId" uuid, "carLogId" uuid, "helperId" uuid, "key" character varying NOT NULL, "mimeType" character varying NOT NULL, "size" bigint NOT NULL, "visibleToClient" boolean NOT NULL DEFAULT false, "uploadedById" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_fbecbece1b332cabffd1ac1ff5" CHECK ("size" >= 0), CONSTRAINT "CHK_f048b5c8fdda990e23896673da" CHECK (("kind" IN ('entrada', 'pieza_danada', 'pieza_nueva', 'firma') AND "carId" IS NOT NULL AND "carLogId" IS NULL AND "helperId" IS NULL)
  OR ("kind" = 'avance' AND "carId" IS NOT NULL AND "carLogId" IS NOT NULL AND "helperId" IS NULL)
  OR ("kind" = 'ayudante' AND "helperId" IS NOT NULL AND "carId" IS NULL AND "carLogId" IS NULL)
  OR ("kind" = 'taller' AND "carId" IS NULL AND "carLogId" IS NULL AND "helperId" IS NULL)), CONSTRAINT "PK_6c16b9093a142e0e7613b04a3d9" PRIMARY KEY ("id"))`);
    await queryRunner.query(
      `CREATE INDEX "IDX_fe2a5c3aa87212ff8cd763acbd" ON "files"  ("carId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_be3c40118d78743c92c66b593d" ON "files"  ("carLogId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6cc3d26875088c6bdf9153c45e" ON "files"  ("helperId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_a5c218dfdf6ad6092fed2230a8" ON "files"  ("key") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_d7bbdb1f5ab46f7eb4ca9abe1a" ON "files"  ("carId") WHERE "kind" = 'firma'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_79d72d1e3d518402a4c9ea96e9" ON "files"  ("shopId", "kind") `,
    );
    await queryRunner.query(
      `CREATE TABLE "helper_payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "shopId" uuid NOT NULL, "carId" uuid NOT NULL, "helperId" uuid NOT NULL, "amount" numeric(12,2) NOT NULL, "paidAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_1fae4e190c66f5c84d273331f6" CHECK ("amount" >= 0), CONSTRAINT "PK_fad581f67aa5b0384e30800765c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bd15687d36c065e2f1d0c481da" ON "helper_payments"  ("shopId", "helperId", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_370edae97faf95ce83e7ae9b79" ON "helper_payments"  ("carId", "helperId") `,
    );
    // Traspaso a "files" de las cuatro ubicaciones anteriores. Los archivos migrados no tienen
    // tipo ni tamaño registrados: quedan como application/octet-stream y 0 bytes.
    await queryRunner.query(`INSERT INTO "files" ("shopId", "kind", "carId", "key", "mimeType", "size", "createdAt")
            SELECT c."shopId", 'entrada', p."carId", p."path", 'application/octet-stream', 0, p."createdAt"
            FROM "car_photos" p JOIN "cars" c ON c."id" = p."carId" ON CONFLICT DO NOTHING`);
    await queryRunner.query(`INSERT INTO "files" ("shopId", "kind", "carId", "carLogId", "key", "mimeType", "size", "visibleToClient", "createdAt")
            SELECT c."shopId", 'avance', l."carId", l."id", u.path, 'application/octet-stream', 0, l."visibleToClient", l."at"
            FROM "car_logs" l JOIN "cars" c ON c."id" = l."carId" CROSS JOIN LATERAL unnest(l."photos") AS u(path) ON CONFLICT DO NOTHING`);
    await queryRunner.query(`INSERT INTO "files" ("shopId", "kind", "carId", "key", "mimeType", "size")
            SELECT "shopId", 'firma', "id", "signaturePath", 'application/octet-stream', 0
            FROM "cars" WHERE "signaturePath" IS NOT NULL ON CONFLICT DO NOTHING`);
    await queryRunner.query(`INSERT INTO "files" ("shopId", "kind", "helperId", "key", "mimeType", "size")
            SELECT "shopId", 'ayudante', "id", "photo", 'application/octet-stream', 0
            FROM "helpers" WHERE "photo" IS NOT NULL ON CONFLICT DO NOTHING`);
    await queryRunner.query(`DROP TABLE "car_photos"`);
    // helpers.paid era un booleano sin monto ni coche: no hay nada que traspasar a helper_payments.
    await queryRunner.query(`ALTER TABLE "helpers" DROP COLUMN "photo"`);
    await queryRunner.query(`ALTER TABLE "helpers" DROP COLUMN "paid"`);
    await queryRunner.query(`ALTER TABLE "cars" DROP COLUMN "signaturePath"`);
    await queryRunner.query(`ALTER TABLE "car_logs" DROP COLUMN "photos"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_57eeb41abc23d7dfc65dc3a994" ON "helpers"  ("id", "shopId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_94aa5cee739330219e9aeefe54" ON "cars"  ("id", "shopId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_3a9a9359a0f5b74266a946dd4e" ON "car_logs"  ("id", "carId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ADD CONSTRAINT "FK_e7d5bdc96508d2bd8a97bfe1709" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ADD CONSTRAINT "FK_422df11bec3723f48b2f0c5dfd5" FOREIGN KEY ("carId", "shopId") REFERENCES "cars"("id","shopId") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ADD CONSTRAINT "FK_5593d761bc9eaab49b0b833d4f0" FOREIGN KEY ("carLogId", "carId") REFERENCES "car_logs"("id","carId") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ADD CONSTRAINT "FK_7631c95924de451d178f8dc1224" FOREIGN KEY ("helperId", "shopId") REFERENCES "helpers"("id","shopId") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" ADD CONSTRAINT "FK_a525d85f0ac59aa9a971825e1af" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "helper_payments" ADD CONSTRAINT "FK_fdcc92f2d48e1c6b48b0f59a345" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "helper_payments" ADD CONSTRAINT "FK_9c4d893e1352465a633135efce1" FOREIGN KEY ("carId", "shopId") REFERENCES "cars"("id","shopId") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "helper_payments" ADD CONSTRAINT "FK_cc1af78c9c09d0dfce66ec54ad4" FOREIGN KEY ("helperId", "shopId") REFERENCES "helpers"("id","shopId") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "helper_payments" DROP CONSTRAINT "FK_cc1af78c9c09d0dfce66ec54ad4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "helper_payments" DROP CONSTRAINT "FK_9c4d893e1352465a633135efce1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "helper_payments" DROP CONSTRAINT "FK_fdcc92f2d48e1c6b48b0f59a345"`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" DROP CONSTRAINT "FK_a525d85f0ac59aa9a971825e1af"`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" DROP CONSTRAINT "FK_7631c95924de451d178f8dc1224"`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" DROP CONSTRAINT "FK_5593d761bc9eaab49b0b833d4f0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" DROP CONSTRAINT "FK_422df11bec3723f48b2f0c5dfd5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" DROP CONSTRAINT "FK_e7d5bdc96508d2bd8a97bfe1709"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3a9a9359a0f5b74266a946dd4e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_94aa5cee739330219e9aeefe54"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_57eeb41abc23d7dfc65dc3a994"`,
    );
    await queryRunner.query(
      `ALTER TABLE "car_logs" ADD "photos" text array NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "cars" ADD "signaturePath" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "helpers" ADD "paid" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "helpers" ADD "photo" character varying`,
    );
    await queryRunner.query(
      `CREATE TABLE "car_photos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "carId" uuid NOT NULL, "path" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d7f7ecfcda4b3ac8ac2cfce1f74" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cadad92c18fba858212e33674e" ON "car_photos"  ("carId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "car_photos" ADD CONSTRAINT "FK_cadad92c18fba858212e33674eb" FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `INSERT INTO "car_photos" ("carId", "path", "createdAt") SELECT "carId", "key", "createdAt" FROM "files" WHERE "kind" IN ('entrada', 'pieza_danada', 'pieza_nueva')`,
    );
    await queryRunner.query(
      `UPDATE "car_logs" l SET "photos" = f.keys FROM (SELECT "carLogId", array_agg("key" ORDER BY "createdAt") AS keys FROM "files" WHERE "kind" = 'avance' GROUP BY "carLogId") f WHERE f."carLogId" = l."id"`,
    );
    await queryRunner.query(
      `UPDATE "cars" c SET "signaturePath" = f."key" FROM "files" f WHERE f."kind" = 'firma' AND f."carId" = c."id"`,
    );
    await queryRunner.query(
      `UPDATE "helpers" h SET "photo" = f."key" FROM "files" f WHERE f."kind" = 'ayudante' AND f."helperId" = h."id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_370edae97faf95ce83e7ae9b79"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bd15687d36c065e2f1d0c481da"`,
    );
    await queryRunner.query(`DROP TABLE "helper_payments"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_79d72d1e3d518402a4c9ea96e9"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d7bbdb1f5ab46f7eb4ca9abe1a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a5c218dfdf6ad6092fed2230a8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6cc3d26875088c6bdf9153c45e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_be3c40118d78743c92c66b593d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fe2a5c3aa87212ff8cd763acbd"`,
    );
    await queryRunner.query(`DROP TABLE "files"`);
    await queryRunner.query(`DROP TYPE "public"."files_kind_enum"`);
  }
}
