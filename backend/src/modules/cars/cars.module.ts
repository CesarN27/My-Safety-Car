import { Module } from '@nestjs/common';
import { ClientsModule } from '../clients/clients.module.js';
import { CarsService } from './cars.service.js';

@Module({
  imports: [ClientsModule],
  providers: [CarsService],
  exports: [CarsService],
})
export class CarsModule {}
