import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Zeitbuchung } from './database/entities/zeitbuchung.entity';
import { ZeiterfassungModule } from './modules/zeiterfassung/zeiterfassung.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL'),
        entities: [Zeitbuchung],
        synchronize: false, // Schema ausschliesslich per Migration, siehe CLAUDE.md
      }),
    }),
    ZeiterfassungModule,
  ],
})
export class AppModule {}
