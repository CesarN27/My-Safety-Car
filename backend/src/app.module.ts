import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { dbConfig } from './database/db-config.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({ ...dbConfig(), migrationsRun: true }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
