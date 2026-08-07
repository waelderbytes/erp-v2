// Seed-Skript fuer Testdaten (Artikel/Kunden/Lieferanten), jederzeit erneut
// ausfuehrbar (Nutzerentscheidung 08.08.2026, siehe docs/session-handoff.md).
// Laeuft bewusst UEBER die echten NestJS-Services (nicht per rohem SQL-
// Insert), damit Nummernkreis-Vergabe, Pflichtfelder (z.B. steuersatz_id)
// und sonstige Business-Logik genauso greifen wie ueber die API. Gedacht als
// Ergaenzung zu scripts/reset-testdaten.sql: erst reset, dann seed.
//
// Lokal:      npm run seed:testdaten          (ts-node, gegen die .env-DB)
// Container:  npm run seed:testdaten:prod      (dist/, nach "npm run build")
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ArtikelService } from '../modules/artikel/artikel.service';
import { KundeService } from '../modules/kunde/kunde.service';
import { LieferantService } from '../modules/lieferant/lieferant.service';
import { EinheitService } from '../modules/einheit/einheit.service';
import { SteuersatzService } from '../modules/steuersatz/steuersatz.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });

  try {
    const artikelService = app.get(ArtikelService);
    const kundeService = app.get(KundeService);
    const lieferantService = app.get(LieferantService);
    const einheitService = app.get(EinheitService);
    const steuersatzService = app.get(SteuersatzService);

    // Einheit/Steuersatz sind Pflichtfelder am Artikel (feldkatalog.md) -
    // per Code/Standard aus den bereits vorhandenen Stammdaten aufloesen,
    // statt sie hier neu anzulegen (die existieren nach den Seed-Migrationen
    // 0009/0014 immer).
    const einheiten = await einheitService.liste();
    const stueckEinheit = einheiten.find((e) => e.code === 'Stk') ?? einheiten[0];
    const stundeEinheit = einheiten.find((e) => e.code === 'h') ?? einheiten[0];
    const standardSteuersatz = await steuersatzService.standard();
    if (!stueckEinheit || !standardSteuersatz) {
      throw new Error(
        'Keine Basis-Einheiten/Standard-Steuersatz gefunden - Migrationen 0009_einheiten.ts / 0014_steuersaetze.ts liefen offenbar nicht durch.',
      );
    }

    console.log('Lege Test-Lieferanten an...');
    const lieferant1 = await lieferantService.anlegen({
      firmenname: 'Muster-Schrauben GmbH',
      ustIdnr: 'DE111111111',
      adressen: [
        { typ: 'rechnung', istStandard: true, strasse: 'Industriestraße 5', plz: '79098', ort: 'Freiburg', land: 'DE' },
      ],
      kontakte: [
        { vorname: 'Anna', nachname: 'Beispiel', funktion: 'Vertrieb', email: 'vertrieb@muster-schrauben.example', istHauptkontakt: true },
      ],
    });
    const lieferant2 = await lieferantService.anlegen({
      firmenname: 'Testholz Handels KG',
      adressen: [
        { typ: 'versand_von', istStandard: true, strasse: 'Sägewerkweg 12', plz: '79312', ort: 'Emmendingen', land: 'DE' },
      ],
    });
    console.log(`  - ${lieferant1.lieferantennummer} ${lieferant1.firmenname}`);
    console.log(`  - ${lieferant2.lieferantennummer} ${lieferant2.firmenname}`);

    console.log('Lege Test-Kunden an...');
    const kunde1 = await kundeService.anlegen({
      typ: 'firma',
      firmenname: 'Beispielbau GmbH',
      ustIdnr: 'DE222222222',
      adressen: [
        { typ: 'rechnung', istStandard: true, strasse: 'Handwerkerring 3', plz: '79100', ort: 'Freiburg', land: 'DE' },
      ],
      kontakte: [
        { vorname: 'Max', nachname: 'Mustermann', funktion: 'Einkauf', email: 'einkauf@beispielbau.example', istHauptkontakt: true },
      ],
    });
    const kunde2 = await kundeService.anlegen({
      typ: 'privatperson',
      vorname: 'Erika',
      nachname: 'Testkundin',
      adressen: [
        { typ: 'rechnung', istStandard: true, strasse: 'Musterweg 7', plz: '79104', ort: 'Freiburg', land: 'DE' },
      ],
    });
    console.log(`  - ${kunde1.kundennummer} ${kunde1.firmenname}`);
    console.log(`  - ${kunde2.kundennummer} ${kunde2.vorname} ${kunde2.nachname}`);

    console.log('Lege Test-Artikel an...');
    const artikel1 = await artikelService.anlegen({
      artikelart: 'handelsware',
      bezeichnung: 'Sechskantschraube M8x40 verzinkt',
      einheitId: stueckEinheit.id,
      steuersatzId: standardSteuersatz.id,
      bestandsgefuehrt: true,
      mindestbestand: '50',
      hersteller: 'Muster-Schrauben GmbH',
    });
    const artikel2 = await artikelService.anlegen({
      artikelart: 'dienstleistung',
      bezeichnung: 'Montage vor Ort (Stundensatz)',
      einheitId: stundeEinheit.id,
      steuersatzId: standardSteuersatz.id,
    });
    const artikel3 = await artikelService.anlegen({
      artikelart: 'fertigungsartikel',
      bezeichnung: 'Testregal Grundmodul',
      einheitId: stueckEinheit.id,
      steuersatzId: standardSteuersatz.id,
      bestandsgefuehrt: true,
      bomfaehig: true,
      mindestbestand: '5',
    });
    console.log(`  - ${artikel1.artikelnummer} ${artikel1.bezeichnung}`);
    console.log(`  - ${artikel2.artikelnummer} ${artikel2.bezeichnung}`);
    console.log(`  - ${artikel3.artikelnummer} ${artikel3.bezeichnung} (bomfaehig)`);

    console.log('Fertig.');
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error('Seed fehlgeschlagen:', err);
  process.exit(1);
});
