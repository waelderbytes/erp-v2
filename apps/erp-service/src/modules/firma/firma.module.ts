import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { Firma } from '../../database/entities/firma.entity';
import { Artikel } from '../../database/entities/artikel.entity';
import { FirmaService } from './firma.service';
import { FirmaController } from './firma.controller';
import { JwtStrategy } from '../../common/auth';

@Module({
  imports: [TypeOrmModule.forFeature([Firma, Artikel]), PassportModule],
  controllers: [FirmaController],
  providers: [FirmaService, JwtStrategy],
  exports: [FirmaService],
})
export class FirmaModule {}
