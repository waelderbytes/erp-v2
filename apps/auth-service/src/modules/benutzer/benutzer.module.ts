import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Benutzer } from '../../database/entities/benutzer.entity';
import { Rolle } from '../../database/entities/rolle.entity';
import { JwtStrategy } from '../../common/auth';
import { PasswortService } from '../auth/passwort.service';
import { BenutzerController } from './benutzer.controller';
import { BenutzerService } from './benutzer.service';

@Module({
  imports: [TypeOrmModule.forFeature([Benutzer, Rolle]), PassportModule, JwtModule.register({})],
  controllers: [BenutzerController],
  providers: [BenutzerService, PasswortService, JwtStrategy],
})
export class BenutzerModule {}
