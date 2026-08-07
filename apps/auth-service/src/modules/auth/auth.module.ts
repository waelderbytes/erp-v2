import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Benutzer } from '../../database/entities/benutzer.entity';
import { Rolle } from '../../database/entities/rolle.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswortService } from './passwort.service';
import { TokenService } from './token.service';

@Module({
  imports: [TypeOrmModule.forFeature([Benutzer, Rolle]), JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, PasswortService, TokenService],
})
export class AuthModule {}
