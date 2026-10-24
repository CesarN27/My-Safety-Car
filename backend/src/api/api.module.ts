import { Module } from '@nestjs/common';
import { CarsModule } from '../modules/cars/cars.module.js';
import { ClientsModule } from '../modules/clients/clients.module.js';
import { FilesModule } from '../modules/files/files.module.js';
import { HelpersModule } from '../modules/helpers/helpers.module.js';
import { ShopsModule } from '../modules/shops/shops.module.js';
import { AdminStatsController } from './admin/admin-stats.controller.js';
import { ClientController } from './client/client.controller.js';
import { HelperController } from './helper/helper.controller.js';
import { PublicController } from './public/public.controller.js';
import { ShopCarsController } from './shop/shop-cars.controller.js';
import { ShopTeamController } from './shop/shop-team.controller.js';

/**
 * Superficies de la API, una por audiencia (docs/arquitectura-backend.md, sección 4).
 * Cada una arma sus respuestas con sus propias vistas; la lógica vive en los módulos de dominio.
 */
@Module({
  imports: [CarsModule, ClientsModule, FilesModule, HelpersModule, ShopsModule],
  controllers: [
    ShopCarsController,
    ShopTeamController,
    HelperController,
    ClientController,
    PublicController,
    AdminStatsController,
  ],
})
export class ApiModule {}
