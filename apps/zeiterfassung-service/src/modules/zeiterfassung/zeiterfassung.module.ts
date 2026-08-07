import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Zeitbuchung } from '../../database/entities/zeitbuchung.entity';
import { JwtStrategy } from '../../common/auth';
import { ZeiterfassungService } from './zeiterfassung.service';
import { ZeiterfassungController } from './zeiterfassung.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Zeitbuchung]), PassportModule],
  controllers: [ZeiterfassungController],
  providers: [ZeiterfassungService, JwtStrategy],
})
export class ZeiterfassungModule {}
