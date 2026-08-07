// TypeORM DataSource fuer Migrationen (CLI) und App-Bootstrap.
// DATABASE_URL siehe .env.example (Tenant-DB dieses Deployments, siehe
// docs/architecture.md Abschnitt 1 - kein zentraler IdP, jeder Auth-Service spricht
// nur mit seiner eigenen Tenant-DB).
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Benutzer } from './entities/benutzer.entity';
import { Rolle } from './entities/rolle.entity';
import { Berechtigung } from './entities/berechtigung.entity';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://erp:changeme@localhost:5432/erp_tenant',
  entities: [Benutzer, Rolle, Berechtigung],
  migrations: [__dirname + '/migrations/*.ts'],
  synchronize: false, // GoBD/Audit: Schema-Aenderungen ausschliesslich per Migration, siehe CLAUDE.md
});
