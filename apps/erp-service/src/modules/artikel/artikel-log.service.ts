import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Lagerbewegung } from '../../database/entities/lagerbewegung.entity';

export interface AuditLogEintrag {
  id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  changedBy: string | null;
  changedAt: Date;
}

// Roadmap-Punkt "Artikel Log-Tab" (siehe session-handoff.md): kombiniert
// Audit-Trail + Lagerbuchungen fuer einen Artikel.
@Injectable()
export class ArtikelLogService {
  constructor(
    // DataSource direkt injiziert (gleiches Muster wie NummernkreisService),
    // KEIN @InjectRepository fuer audit_log: die Tabelle wird von der
    // auth-service-Migration 0001 angelegt und verwaltet (liegt aber
    // physisch in derselben Tenant-DB, siehe architecture.md
    // Multi-Tenancy-Modell). erp-service liest hier nur mit, bewusst per
    // roher Query statt einer eigenen TypeORM-Entity/Migration fuer eine
    // Tabelle, die ein anderer Service besitzt - vermeidet ausserdem eine
    // weitere Stelle fuer die DI-Wiring-Fallen aus session-handoff.md.
    private readonly dataSource: DataSource,
    @InjectRepository(Lagerbewegung) private readonly lagerbewegungRepo: Repository<Lagerbewegung>,
  ) {}

  private async ladeAuditLog(artikelId: string): Promise<AuditLogEintrag[]> {
    const rows: Array<{
      id: number;
      operation: 'INSERT' | 'UPDATE' | 'DELETE';
      old_data: Record<string, unknown> | null;
      new_data: Record<string, unknown> | null;
      changed_by: string | null;
      changed_at: Date;
    }> = await this.dataSource.query(
      `SELECT id, operation, old_data, new_data, changed_by, changed_at
       FROM audit_log
       WHERE table_name = 'artikel' AND record_id = $1
       ORDER BY changed_at DESC`,
      [artikelId],
    );
    return rows.map((r) => ({
      id: String(r.id),
      operation: r.operation,
      oldData: r.old_data,
      newData: r.new_data,
      changedBy: r.changed_by,
      changedAt: r.changed_at,
    }));
  }

  private ladeLagerbewegungen(artikelId: string): Promise<Lagerbewegung[]> {
    return this.lagerbewegungRepo.find({
      where: { artikelId },
      relations: ['lager'],
      order: { gebuchtAm: 'DESC' },
    });
  }

  async log(artikelId: string): Promise<{ auditLog: AuditLogEintrag[]; lagerbewegungen: Lagerbewegung[] }> {
    const [auditLog, lagerbewegungen] = await Promise.all([
      this.ladeAuditLog(artikelId),
      this.ladeLagerbewegungen(artikelId),
    ]);
    return { auditLog, lagerbewegungen };
  }
}
