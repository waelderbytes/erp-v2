import { Module } from '@nestjs/common';
import { BenutzerModule } from './modules/benutzer/benutzer.module';
import { RollenModule } from './modules/rollen/rollen.module';

@Module({
  imports: [BenutzerModule, RollenModule],
})
export class AppModule {}
