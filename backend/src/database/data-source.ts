import { DataSource } from 'typeorm';
import { dbConfig } from './db-config.js';

/** Entrada de la CLI de TypeORM (scripts migration:*). */
export default new DataSource(dbConfig());
