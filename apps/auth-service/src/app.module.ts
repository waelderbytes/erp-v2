import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Benutzer } from './database/entities/benutzer.entity';
import { Rolle } from './database/entities/rolle.entity';
import { Berechtigung } from './database/entities/berechtigung.entity';
import { KioskGeraet } from './database/entities/kiosk-geraet.entity';
import { AuthModule } from './modules/auth/auth.module';
import { BenutzerModule } from './modules/benutzer/benutzer.module';
import { RollenModule } from './modules/rollen/rollen.module';
import { KioskModule } from './modules/kiosk/kiosk.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL'),
        entities: [Benutzer, Rolle, Berechtigung, KioskGeraet],
        synchronize: false, // Schema ausschliesslich per Migration, siehe CLAUDE.md
      }),
    }),
    AuthModule,
    BenutzerModule,
    RollenModule,
    KioskModule,
  ],
})
export class AppModule {}
