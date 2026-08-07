// Einstiegspunkt Auth-Service.
// Eigener JWT-basierter Auth-Service pro Tenant-Deployment, KEIN zentraler IdP/Keycloak
// (Entscheidung 07.08.2026, siehe docs/architecture.md Abschnitt 1). Prueft Login/Token
// ausschliesslich gegen die Tenant-DB dieses Deployments.
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
