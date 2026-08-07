import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { Einheit } from '../../database/entities/einheit.entity';
import { EinheitService } from './einheit.service';
import { EinheitController } from './einheit.controller';
import { JwtStrategy } from '../../common/auth';

@Module({
  imports: [TypeOrmModule.forFeature([Einheit]), PassportModule],
  controllers: [EinheitController],
  providers: [EinheitService, JwtStrategy],
  exports: [EinheitService],
})
export class EinheitModule {}
