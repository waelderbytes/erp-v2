// Einstiegspunkt erp-service. Erstes Fachmodul: Artikelstamm (siehe
// docs/module-uebersicht.md Phase 1). Spricht mit derselben Tenant-DB wie
// auth-service (1 DB pro Tenant, mehrere Services - siehe docs/architecture.md).
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  // Siehe all-exceptions.filter.ts: liefert bei unerwarteten (nicht bewusst
  // geworfenen) Fehlern optional (ENV DEBUG_ERRORS=true) Fehlermeldung +
  // Stacktrace direkt in der HTTP-Antwort statt nur "Internal server error".
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.listen(3000);
}
bootstrap();
