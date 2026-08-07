// Einstiegspunkt erp-service. Erstes Fachmodul: Artikelstamm (siehe
// docs/module-uebersicht.md Phase 1). Spricht mit derselben Tenant-DB wie
// auth-service (1 DB pro Tenant, mehrere Services - siehe docs/architecture.md).
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(3000);
}
bootstrap();
