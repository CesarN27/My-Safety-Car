import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiModule } from './api/api.module.js';
import { AuthModule } from './auth/auth.module.js';
import { validateEnv } from './config/env.js';
import { dbConfig } from './database/db-config.js';
import { HealthModule } from './health/health.module.js';
import { ShopsModule } from './modules/shops/shops.module.js';
import { UsersModule } from './modules/users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({ ...dbConfig(), migrationsRun: true }),
    }),
    // Límite general por IP; las rutas de acceso lo endurecen con @Throttle.
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 120 }],
      // Las pruebas e2e hacen muchas peticiones seguidas desde la misma IP.
      skipIf: () => process.env.NODE_ENV === 'test',
    }),
    HealthModule,
    UsersModule,
    AuthModule,
    ShopsModule,
    ApiModule,
  ],
})
export class AppModule {}
