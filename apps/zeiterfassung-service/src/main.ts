// Einstiegspunkt zeiterfassung-service. Eigener Service (nicht Teil von
// erp-service) fuer Kommt/Geht/Pause-Zeiterfassung, siehe
// docs/module-uebersicht.md Phase 2 "Zeiterfassung". Spricht mit derselben
// Tenant-DB wie auth-service/erp-service (1 DB pro Tenant, mehrere Services -
// siehe docs/architecture.md), eigene Migrations-Historie.
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(3000);
}
bootstrap();
