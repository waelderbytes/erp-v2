import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Firma } from '../../database/entities/firma.entity';
import { Artikel } from '../../database/entities/artikel.entity';
import { FirmaService } from './firma.service';

@Module({
  imports: [TypeOrmModule.forFeature([Firma, Artikel])],
  providers: [FirmaService],
  exports: [FirmaService],
})
export class FirmaModule {}
