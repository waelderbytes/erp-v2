// Einstiegspunkt: Routing zu den Fach-Services, Auth-Check, Rate-Limiting.
// Siehe docs/architecture.md Abschnitt 3 (Verzeichnisstruktur).
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  await app.listen(3000);
}
bootstrap();
