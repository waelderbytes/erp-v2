// Eigene Migrations-Historie fuer zeiterfassung-service, getrennter
// migrationsTableName damit keine Kollision mit auth-service/erp-service in
// derselben physischen Tenant-DB entsteht (siehe docs/architecture.md).
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Zeitbuchung } from './entities/zeitbuchung.entity';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://erp:changeme@localhost:5432/erp_tenant',
  entities: [Zeitbuchung],
  migrations: [__dirname + '/migrations/*.{ts,js}'], // .ts fuer lokalen ts-node-Lauf, .js fuer den kompilierten dist/-Lauf im Container (siehe migration:run:prod)
  migrationsTableName: 'migrations_zeiterfassung_service',
  synchronize: false,
});
