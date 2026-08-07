import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Benutzer } from '../../database/entities/benutzer.entity';
import { KioskGeraet } from '../../database/entities/kiosk-geraet.entity';
import { JwtStrategy } from '../../common/auth';
import { PasswortService } from '../auth/passwort.service';
import { TokenService } from '../auth/token.service';
import { KioskGeraetService } from './kiosk-geraet.service';
import { KioskAuthService } from './kiosk-auth.service';
import { KioskController } from './kiosk.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Benutzer, KioskGeraet]), PassportModule, JwtModule.register({})],
  controllers: [KioskController],
  providers: [KioskGeraetService, KioskAuthService, PasswortService, TokenService, JwtStrategy],
})
export class KioskModule {}
