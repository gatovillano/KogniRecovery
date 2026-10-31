'use client';

import { NumaShell } from '@/components/numa-shell';
import { OrgPanel } from '@/components/org-panel';

export default function OrganizationPage() {
  return (
    <NumaShell title="Administración">
      <section className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#719184]">
            Gestión del centro
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-[#203b35] sm:text-[34px]">
            Administración del Centro
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pacientes, invitaciones, miembros y auditoría
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
          Panel de la organización
        </div>
      </section>

      <OrgPanel />
    </NumaShell>
  );
}
