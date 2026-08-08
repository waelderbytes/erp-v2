import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { BelegService } from './beleg.service';
import { BelegController } from './beleg.controller';
import { NummernkreisModule } from '../nummernkreis/nummernkreis.module';
import { PreisfindungModule } from '../preisfindung/preisfindung.module';
import { LagerModule } from '../lager/lager.module';
import { JwtStrategy } from '../../common/auth';

// Kein eigenes TypeOrmModule.forFeature(...) noetig - beleg.service.ts nutzt
// ausschliesslich this.dataSource direkt (analog nummernkreis.service.ts),
// kein @InjectRepository.
@Module({
  imports: [PassportModule, NummernkreisModule, PreisfindungModule, LagerModule],
  controllers: [BelegController],
  providers: [BelegService, JwtStrategy],
})
export class BelegModule {}
