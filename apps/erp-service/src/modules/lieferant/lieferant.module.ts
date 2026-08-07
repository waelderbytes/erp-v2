import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { Lieferant } from '../../database/entities/lieferant.entity';
import { LieferantAdresse } from '../../database/entities/lieferant-adresse.entity';
import { LieferantKontakt } from '../../database/entities/lieferant-kontakt.entity';
import { NummernkreisModule } from '../nummernkreis/nummernkreis.module';
import { LieferantService } from './lieferant.service';
import { LieferantController } from './lieferant.controller';
import { JwtStrategy } from '../../common/auth';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lieferant, LieferantAdresse, LieferantKontakt]),
    PassportModule,
    NummernkreisModule,
  ],
  controllers: [LieferantController],
  providers: [LieferantService, JwtStrategy],
})
export class LieferantModule {}
