'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PatientClinicalTabs } from '@/components/patient-clinical-tabs';
import { NumaShell } from '@/components/numa-shell';
import { api } from '@/lib/api';
import { ArrowLeft, FileText, Shield, Activity } from 'lucide-react';
import { toast } from 'sonner';

interface ConsentCategoryInfo {
  category: string;
  detail_level: string;
  enabled: boolean;
}

interface ConsentRecord {
  id: string;
  categories: ConsentCategoryInfo[];
}

interface OverviewCheckin {
  id?: string;
  checkin_date: string | Date;
  mood_score?: number | null;
  anxiety_score?: number | null;
}

interface PatientOverview {
  patient: {
    id: string;
    display_name: string;
    care_status: string;
    enrolled_at: string | null;
    assigned_professional: string | null;
  };
  consent: {
    sharedCategories: Record<string, string>;
    unavailableCategories: string[];
    consents: ConsentRecord[];
  };
  checkins: OverviewCheckin[];
  checkins_error: string | null;
}

export function PatientDetailClient({ patientId }: { patientId: string }) {
  const router = useRouter();

  const [overview, setOverview] = useState<PatientOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await api.get<PatientOverview>(`/therapist/patients/${patientId}/overview`);
        if (cancelled) return;
        if (response.success && response.data) {
          setOverview(response.data);
        } else {
          toast.error(response.error?.message || 'Error al cargar información');
        }
      } catch (error) {
        if (cancelled) return;
        console.error('Error loading overview:', error);
        toast.error('Error al conectar con el servidor');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [patientId]);

  if (loading) {
    return (
      <NumaShell title="Ficha de paciente">
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </NumaShell>
    );
  }

  if (!overview) {
    return (
      <NumaShell title="Ficha de paciente">
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
          <p className="text-sm text-muted-foreground">No se pudo cargar la información</p>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            Volver al dashboard
          </button>
        </div>
      </NumaShell>
    );
  }

  const isActive = overview.patient.care_status === 'active';

  return (
    <NumaShell title="Ficha de paciente">
      <button
        type="button"
        onClick={() => router.push('/dashboard')}
        className="mb-6 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        <ArrowLeft size={16} /> Volver a pacientes
      </button>

      <section className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#719184]">
            Ficha clínica
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-[#203b35] sm:text-[34px]">
            {overview.patient.display_name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Información compartida bajo consentimiento activo.
          </p>
        </div>
        <span
          className={`w-fit rounded-full px-3 py-1 text-[11px] font-medium ${
            isActive ? 'bg-secondary text-[#5b846d]' : 'bg-muted text-muted-foreground'
          }`}
        >
          {isActive ? 'Activo' : overview.patient.care_status}
        </span>
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="rounded-lg bg-secondary p-2 text-[#56806d]">
                <Shield className="h-5 w-5" />
              </span>
              Consentimiento
            </CardTitle>
            <CardDescription>Datos compartidos por el paciente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Categorías compartidas:</p>
              {Object.keys(overview.consent.sharedCategories).length === 0 ? (
                <p className="text-sm text-muted-foreground">Ninguna categoría compartida</p>
              ) : (
                <ul className="space-y-2">
                  {Object.entries(overview.consent.sharedCategories).map(([cat, level]) => (
                    <li key={cat} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-foreground">{cat}</span>
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                        {level}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="rounded-lg bg-secondary p-2 text-[#56806d]">
                <Activity className="h-5 w-5" />
              </span>
              Check-ins recientes
            </CardTitle>
            <CardDescription>Últimos 7 días</CardDescription>
          </CardHeader>
          <CardContent>
            {overview.checkins_error ? (
              <p className="text-sm text-[#a68b54]">
                {overview.checkins_error === 'CONSENT_REQUIRED'
                  ? 'El paciente no ha compartido los check-ins'
                  : overview.checkins_error}
              </p>
            ) : overview.checkins.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay check-ins</p>
            ) : (
              <div className="space-y-3">
                {overview.checkins.slice(0, 5).map((checkin: OverviewCheckin, idx: number) => (
                  <div key={idx} className="border-b border-border pb-3 text-sm last:border-0 last:pb-0">
                    <p className="font-medium text-foreground">
                      {checkin.checkin_date instanceof Date
                        ? checkin.checkin_date.toISOString().slice(0, 10)
                        : checkin.checkin_date}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      Ánimo: {checkin.mood_score}/10 | Ansiedad: {checkin.anxiety_score}/10
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="rounded-lg bg-secondary p-2 text-[#56806d]">
              <FileText className="h-5 w-5" />
            </span>
            Registro clínico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PatientClinicalTabs patientId={patientId} />
        </CardContent>
      </Card>
    </NumaShell>
  );
}
