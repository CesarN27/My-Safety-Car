import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1791693999055 implements MigrationInterface {
  name = 'InitialSchema1791693999055';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."shops_status_enum" AS ENUM('activo', 'pausado', 'invitado')`,
    );
    await queryRunner.query(
      `CREATE TABLE "shops" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "owner" character varying NOT NULL, "phone" character varying NOT NULL, "zone" character varying NOT NULL, "address" character varying NOT NULL, "specialties" text array NOT NULL DEFAULT '{}', "status" "public"."shops_status_enum" NOT NULL DEFAULT 'invitado', "verified" boolean NOT NULL DEFAULT false, "hours" character varying NOT NULL, "lat" double precision NOT NULL, "lng" double precision NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3c6aaa6607d287de99815e60b96" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'taller', 'ayudante', 'cliente')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "phone" character varying NOT NULL, "name" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL, "shopId" uuid, "active" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_a000cca60bcf04454e72769949" ON "users"  ("phone") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."helpers_paytype_enum" AS ENUM('fijo', 'porcentaje')`,
    );
    await queryRunner.query(
      `CREATE TABLE "helpers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "shopId" uuid NOT NULL, "userId" uuid, "name" character varying NOT NULL, "phone" character varying NOT NULL, "photo" character varying, "payType" "public"."helpers_paytype_enum" NOT NULL, "payAmount" numeric(12,2), "payPct" numeric(5,2), "paid" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_04c83cce51f546b9970498e2c87" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7d32d8c8fa412c8c91e6144fca" ON "helpers"  ("shopId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."cost_items_kind_enum" AS ENUM('refaccion', 'mano', 'gasto')`,
    );
    await queryRunner.query(
      `CREATE TABLE "cost_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "carId" uuid NOT NULL, "kind" "public"."cost_items_kind_enum" NOT NULL, "desc" character varying NOT NULL, "cost" numeric(12,2) NOT NULL DEFAULT '0', "price" numeric(12,2) NOT NULL DEFAULT '0', "supplier" character varying, CONSTRAINT "PK_7c98b6ed12112ffb9b3f8369c97" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3bb522735f1220a30cd591e176" ON "cost_items"  ("carId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "cars" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "shopId" uuid NOT NULL, "folio" character varying NOT NULL, "qrToken" character varying NOT NULL, "enteredAt" TIMESTAMP NOT NULL DEFAULT now(), "brand" character varying NOT NULL, "model" character varying NOT NULL, "year" character varying NOT NULL, "color" character varying NOT NULL, "plates" character varying NOT NULL, "vin" character varying NOT NULL, "km" character varying NOT NULL, "clientName" character varying NOT NULL, "clientPhone" character varying NOT NULL, "clientAddress" character varying NOT NULL, "clientUserId" uuid, "state" smallint NOT NULL DEFAULT '0', "helperId" uuid, "description" character varying NOT NULL DEFAULT '', "inspection" jsonb NOT NULL DEFAULT '{}', "fuel" real NOT NULL DEFAULT '0', "damages" jsonb NOT NULL DEFAULT '[]', "signaturePath" character varying, "ivaOn" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_fc218aa84e79b477d55322271b6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3ceff722c80e7723375fe69106" ON "cars"  ("shopId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_7c66fb5f9c3bd032eefbe9a7d5" ON "cars"  ("folio") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_06a1b4d5abab3adeede98c10c9" ON "cars"  ("qrToken") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c1ceb9fd4ef605aee57cc9187b" ON "cars"  ("clientUserId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "car_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "carId" uuid NOT NULL, "state" smallint NOT NULL, "authorId" uuid, "authorName" character varying NOT NULL, "note" text, "photos" text array NOT NULL DEFAULT '{}', "visibleToClient" boolean NOT NULL DEFAULT true, "at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_25194088a73e0777e2f71fc79d0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4ee3d95d7de63a4bb7cae3dce2" ON "car_logs"  ("carId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "car_photos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "carId" uuid NOT NULL, "path" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d7f7ecfcda4b3ac8ac2cfce1f74" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cadad92c18fba858212e33674e" ON "car_photos"  ("carId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_7680babafb8b9ca907bfbd142c5" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "helpers" ADD CONSTRAINT "FK_7d32d8c8fa412c8c91e6144fca1" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "helpers" ADD CONSTRAINT "FK_d21c0502cb840ef8eccba51a45b" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_items" ADD CONSTRAINT "FK_3bb522735f1220a30cd591e1769" FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cars" ADD CONSTRAINT "FK_3ceff722c80e7723375fe691065" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cars" ADD CONSTRAINT "FK_c1ceb9fd4ef605aee57cc9187b6" FOREIGN KEY ("clientUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cars" ADD CONSTRAINT "FK_0cceaf5ff00107ae8b7f83fff89" FOREIGN KEY ("helperId") REFERENCES "helpers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "car_logs" ADD CONSTRAINT "FK_4ee3d95d7de63a4bb7cae3dce27" FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "car_logs" ADD CONSTRAINT "FK_ac66fd53a0f78fa2f0549b8802b" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "car_photos" ADD CONSTRAINT "FK_cadad92c18fba858212e33674eb" FOREIGN KEY ("carId") REFERENCES "cars"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "car_photos" DROP CONSTRAINT "FK_cadad92c18fba858212e33674eb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "car_logs" DROP CONSTRAINT "FK_ac66fd53a0f78fa2f0549b8802b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "car_logs" DROP CONSTRAINT "FK_4ee3d95d7de63a4bb7cae3dce27"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cars" DROP CONSTRAINT "FK_0cceaf5ff00107ae8b7f83fff89"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cars" DROP CONSTRAINT "FK_c1ceb9fd4ef605aee57cc9187b6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cars" DROP CONSTRAINT "FK_3ceff722c80e7723375fe691065"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cost_items" DROP CONSTRAINT "FK_3bb522735f1220a30cd591e1769"`,
    );
    await queryRunner.query(
      `ALTER TABLE "helpers" DROP CONSTRAINT "FK_d21c0502cb840ef8eccba51a45b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "helpers" DROP CONSTRAINT "FK_7d32d8c8fa412c8c91e6144fca1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_7680babafb8b9ca907bfbd142c5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cadad92c18fba858212e33674e"`,
    );
    await queryRunner.query(`DROP TABLE "car_photos"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4ee3d95d7de63a4bb7cae3dce2"`,
    );
    await queryRunner.query(`DROP TABLE "car_logs"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c1ceb9fd4ef605aee57cc9187b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_06a1b4d5abab3adeede98c10c9"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7c66fb5f9c3bd032eefbe9a7d5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3ceff722c80e7723375fe69106"`,
    );
    await queryRunner.query(`DROP TABLE "cars"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3bb522735f1220a30cd591e176"`,
    );
    await queryRunner.query(`DROP TABLE "cost_items"`);
    await queryRunner.query(`DROP TYPE "public"."cost_items_kind_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7d32d8c8fa412c8c91e6144fca"`,
    );
    await queryRunner.query(`DROP TABLE "helpers"`);
    await queryRunner.query(`DROP TYPE "public"."helpers_paytype_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a000cca60bcf04454e72769949"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(`DROP TABLE "shops"`);
    await queryRunner.query(`DROP TYPE "public"."shops_status_enum"`);
  }
}
