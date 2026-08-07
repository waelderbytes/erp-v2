import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rolle } from '../../database/entities/rolle.entity';
import { JwtStrategy } from '../../common/auth';
import { RollenController } from './rollen.controller';
import { RollenService } from './rollen.service';

@Module({
  imports: [TypeOrmModule.forFeature([Rolle]), PassportModule, JwtModule.register({})],
  controllers: [RollenController],
  providers: [RollenService, JwtStrategy],
})
export class RollenModule {}
