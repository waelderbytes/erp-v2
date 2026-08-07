import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { Steuersatz } from '../../database/entities/steuersatz.entity';
import { SteuersatzService } from './steuersatz.service';
import { SteuersatzController } from './steuersatz.controller';
import { JwtStrategy } from '../../common/auth';

@Module({
  imports: [TypeOrmModule.forFeature([Steuersatz]), PassportModule],
  controllers: [SteuersatzController],
  providers: [SteuersatzService, JwtStrategy],
  exports: [SteuersatzService],
})
export class SteuersatzModule {}
