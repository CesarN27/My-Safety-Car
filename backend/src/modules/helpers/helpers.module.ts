import { Module } from '@nestjs/common';
import { HelpersService } from './helpers.service.js';

@Module({
  providers: [HelpersService],
  exports: [HelpersService],
})
export class HelpersModule {}
