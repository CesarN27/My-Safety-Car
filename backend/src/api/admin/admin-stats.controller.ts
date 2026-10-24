import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Roles } from '../../auth/decorators/roles.decorator.js';

/**
 * Panel general del admin master: solo conteos. Por diseño (PDF, "Reglas de privacidad") el admin
 * no ve expedientes, descripciones, fotos ni dinero de ningún taller.
 */
@Roles('admin')
@Controller('admin/stats')
export class AdminStatsController {
  constructor(private readonly db: DataSource) {}

  @Get()
  async stats() {
    const [shops, clients, carsByMonth] = await Promise.all([
      this.db.query<{ status: string; count: string }[]>(
        `SELECT "status", COUNT(*) AS "count" FROM "shops" GROUP BY "status"`,
      ),
      this.db.query<{ count: string }[]>(
        `SELECT COUNT(*) AS "count" FROM "users" WHERE "role" = 'cliente'`,
      ),
      this.db.query<{ month: string; count: string }[]>(
        `SELECT to_char(date_trunc('month', "enteredAt"), 'YYYY-MM') AS "month", COUNT(*) AS "count"
         FROM "cars" WHERE "enteredAt" >= date_trunc('month', now()) - interval '11 months'
         GROUP BY 1 ORDER BY 1`,
      ),
    ]);
    return {
      shops: Object.fromEntries(shops.map((r) => [r.status, Number(r.count)])),
      clients: Number(clients[0]?.count ?? 0),
      carsByMonth: carsByMonth.map((r) => ({
        month: r.month,
        count: Number(r.count),
      })),
    };
  }
}
