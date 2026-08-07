import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Artikelpreis } from '../../database/entities/artikelpreis.entity';
import { PreisfindungService } from './preisfindung.service';
import { PreisfindungController } from './preisfindung.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Artikelpreis])],
  controllers: [PreisfindungController],
  providers: [PreisfindungService],
})
export class PreisfindungModule {}
