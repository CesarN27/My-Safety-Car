import { Module } from '@nestjs/common';
import { FilesService } from './files.service.js';
import { LocalDiskStorage } from './local-disk.storage.js';
import { Storage } from './storage.js';

@Module({
  providers: [
    FilesService,
    // Cambiar a S3/R2 es cambiar esta línea.
    { provide: Storage, useClass: LocalDiskStorage },
  ],
  exports: [FilesService],
})
export class FilesModule {}
