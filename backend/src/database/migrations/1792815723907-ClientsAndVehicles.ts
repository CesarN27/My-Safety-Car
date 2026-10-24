import { MigrationInterface, QueryRunner } from 'typeorm';

export class ClientsAndVehicles1792815723907 implements MigrationInterface {
  name = 'ClientsAndVehicles1792815723907';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cars" DROP CONSTRAINT "FK_c1ceb9fd4ef605aee57cc9187b6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c1ceb9fd4ef605aee57cc9187b"`,
    );
    await queryRunner.query(
      `CREATE TABLE "clients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "shopId" uuid NOT NULL, "name" character varying NOT NULL, "phone" character varying NOT NULL, "address" character varying NOT NULL DEFAULT '', "userId" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_f1ab7cf3a5714dbc6bb4e1c28a4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_59c1e5e51addd6ebebf76230b3" ON "clients"  ("userId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_085836b32b35efe372b4480a92" ON "clients"  ("id", "shopId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_31ce0cb81603930f69ca8d4fed" ON "clients"  ("shopId", "phone") `,
    );
    await queryRunner.query(
      `CREATE TABLE "vehicles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "shopId" uuid NOT NULL, "clientId" uuid NOT NULL, "brand" character varying NOT NULL, "model" character varying NOT NULL, "year" character varying NOT NULL, "color" character varying NOT NULL, "plates" character varying NOT NULL DEFAULT '', "vin" character varying NOT NULL DEFAULT '', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_18d8646b59304dce4af3a9e35b6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_152c413c6b66761cb34acb555c" ON "vehicles"  ("clientId") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_03d253dca240cfdd1bff67ebe7" ON "vehicles"  ("id", "shopId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4f403f98b1974c4d62155b5d51" ON "vehicles"  ("shopId", "vin") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9bfae17fc191d685fb414b2324" ON "vehicles"  ("shopId", "plates") `,
    );
    await queryRunner.query(`ALTER TABLE "cars" ADD "vehicleId" uuid`);
    await queryRunner.query(`ALTER TABLE "cars" ADD "clientId" uuid`);
    // Traspaso de los datos que ya viven en "cars": un cliente por (taller, teléfono) y un
    // vehículo por (taller, teléfono, placas, VIN), tomando los datos del expediente más reciente.
    await queryRunner.query(`INSERT INTO "clients" ("shopId", "name", "phone", "address", "userId")
            SELECT DISTINCT ON ("shopId", "clientPhone") "shopId", "clientName", "clientPhone", "clientAddress", "clientUserId"
            FROM "cars" ORDER BY "shopId", "clientPhone", "enteredAt" DESC`);
    await queryRunner.query(`INSERT INTO "vehicles" ("shopId", "clientId", "brand", "model", "year", "color", "plates", "vin")
            SELECT DISTINCT ON (c."shopId", c."clientPhone", c."plates", c."vin") c."shopId", cl."id", c."brand", c."model", c."year", c."color", c."plates", c."vin"
            FROM "cars" c JOIN "clients" cl ON cl."shopId" = c."shopId" AND cl."phone" = c."clientPhone"
            ORDER BY c."shopId", c."clientPhone", c."plates", c."vin", c."enteredAt" DESC`);
    await queryRunner.query(`UPDATE "cars" c SET "clientId" = cl."id"
            FROM "clients" cl WHERE cl."shopId" = c."shopId" AND cl."phone" = c."clientPhone"`);
    await queryRunner.query(`UPDATE "cars" c SET "vehicleId" = v."id"
            FROM "vehicles" v WHERE v."clientId" = c."clientId" AND v."plates" = c."plates" AND v."vin" = c."vin"`);
    await queryRunner.query(
      `ALTER TABLE "cars" ALTER COLUMN "vehicleId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "cars" ALTER COLUMN "clientId" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "cars" DROP COLUMN "brand"`);
    await queryRunner.query(`ALTER TABLE "cars" DROP COLUMN "model"`);
    await queryRunner.query(`ALTER TABLE "cars" DROP COLUMN "year"`);
    await queryRunner.query(`ALTER TABLE "cars" DROP COLUMN "color"`);
    await queryRunner.query(`ALTER TABLE "cars" DROP COLUMN "plates"`);
    await queryRunner.query(`ALTER TABLE "cars" DROP COLUMN "vin"`);
    await queryRunner.query(`ALTER TABLE "cars" DROP COLUMN "clientName"`);
    await queryRunner.query(`ALTER TABLE "cars" DROP COLUMN "clientPhone"`);
    await queryRunner.query(`ALTER TABLE "cars" DROP COLUMN "clientAddress"`);
    await queryRunner.query(`ALTER TABLE "cars" DROP COLUMN "clientUserId"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_d854462d22101cd628599f1553" ON "cars"  ("vehicleId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a3bd377c1beb7a30919cc6c523" ON "cars"  ("clientId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD CONSTRAINT "FK_54038baca0bf0aff08f2ef0028f" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ADD CONSTRAINT "FK_59c1e5e51addd6ebebf76230b37" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD CONSTRAINT "FK_240833b28d18a25f383fad0db94" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD CONSTRAINT "FK_ba3e04ab9a7bf5cf5d2383746c2" FOREIGN KEY ("clientId", "shopId") REFERENCES "clients"("id","shopId") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cars" ADD CONSTRAINT "FK_efe1ad37933501fdbc7a4f31a76" FOREIGN KEY ("vehicleId", "shopId") REFERENCES "vehicles"("id","shopId") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cars" ADD CONSTRAINT "FK_08f42a0b647df6fd9e94bf59b2f" FOREIGN KEY ("clientId", "shopId") REFERENCES "clients"("id","shopId") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cars" DROP CONSTRAINT "FK_08f42a0b647df6fd9e94bf59b2f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cars" DROP CONSTRAINT "FK_efe1ad37933501fdbc7a4f31a76"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" DROP CONSTRAINT "FK_ba3e04ab9a7bf5cf5d2383746c2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" DROP CONSTRAINT "FK_240833b28d18a25f383fad0db94"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" DROP CONSTRAINT "FK_59c1e5e51addd6ebebf76230b37"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" DROP CONSTRAINT "FK_54038baca0bf0aff08f2ef0028f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a3bd377c1beb7a30919cc6c523"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d854462d22101cd628599f1553"`,
    );
    await queryRunner.query(`ALTER TABLE "cars" ADD "clientUserId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "cars" ADD "clientAddress" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "cars" ADD "clientPhone" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "cars" ADD "clientName" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "cars" ADD "vin" character varying`);
    await queryRunner.query(
      `ALTER TABLE "cars" ADD "plates" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "cars" ADD "color" character varying`);
    await queryRunner.query(`ALTER TABLE "cars" ADD "year" character varying`);
    await queryRunner.query(`ALTER TABLE "cars" ADD "model" character varying`);
    await queryRunner.query(`ALTER TABLE "cars" ADD "brand" character varying`);
    await queryRunner.query(`UPDATE "cars" c SET "brand" = v."brand", "model" = v."model", "year" = v."year", "color" = v."color", "plates" = v."plates", "vin" = v."vin"
            FROM "vehicles" v WHERE v."id" = c."vehicleId"`);
    await queryRunner.query(`UPDATE "cars" c SET "clientName" = cl."name", "clientPhone" = cl."phone", "clientAddress" = cl."address", "clientUserId" = cl."userId"
            FROM "clients" cl WHERE cl."id" = c."clientId"`);
    await queryRunner.query(
      `ALTER TABLE "cars" ALTER COLUMN "brand" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "cars" ALTER COLUMN "model" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "cars" ALTER COLUMN "year" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "cars" ALTER COLUMN "color" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "cars" ALTER COLUMN "plates" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "cars" ALTER COLUMN "vin" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "cars" ALTER COLUMN "clientName" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "cars" ALTER COLUMN "clientPhone" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "cars" ALTER COLUMN "clientAddress" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "cars" DROP COLUMN "clientId"`);
    await queryRunner.query(`ALTER TABLE "cars" DROP COLUMN "vehicleId"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9bfae17fc191d685fb414b2324"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4f403f98b1974c4d62155b5d51"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_03d253dca240cfdd1bff67ebe7"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_152c413c6b66761cb34acb555c"`,
    );
    await queryRunner.query(`DROP TABLE "vehicles"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_31ce0cb81603930f69ca8d4fed"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_085836b32b35efe372b4480a92"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_59c1e5e51addd6ebebf76230b3"`,
    );
    await queryRunner.query(`DROP TABLE "clients"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_c1ceb9fd4ef605aee57cc9187b" ON "cars" USING btree ("clientUserId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "cars" ADD CONSTRAINT "FK_c1ceb9fd4ef605aee57cc9187b6" FOREIGN KEY ("clientUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }
}
