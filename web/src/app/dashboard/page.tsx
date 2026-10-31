'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  HeartPulse,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { NumaShell } from '@/components/numa-shell';

interface Patient {
  id: string;
  organization_patient_id: string;
  display_name: string;
  care_status: string;
  enrolled_at: string | null;
  assignment_role: string | null;
}

interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function statusLabel(status: string) {
  if (status === 'active') return 'Activo';
  if (status === 'paused') return 'En pausa';
  if (status === 'completed') return 'Finalizado';
  return status;
}

export default function DashboardPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let mounted = true;
    const loadAll = async () => {
      try {
        const [meResponse, patientsResponse] = await Promise.all([
          api.me(),
          api.get<{ organization_id: string; patients: Patient[] }>('/therapist/patients'),
        ]);
        if (!mounted) return;
        if (meResponse.success && meResponse.data) setUser(meResponse.data.user);
        if (patientsResponse.success && patientsResponse.data) {
          setPatients(patientsResponse.data.patients ?? []);
        }
      } catch (error) {
        console.error('Error cargando panel:', error);
        if (mounted) toast.error('No se pudieron cargar los datos del panel');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadAll();
    return () => { mounted = false; };
  }, []);

  const activePatients = useMemo(
    () => patients.filter((patient) => patient.care_status === 'active'),
    [patients],
  );
  const filteredPatients = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('es');
    if (!term) return patients;
    return patients.filter((patient) => patient.display_name.toLocaleLowerCase('es').includes(term));
  }, [patients, search]);

  return (
    <NumaShell title="Resumen">
      <section className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#719184]">Tu espacio de acompañamiento</p>
          <h1 className="text-3xl font-semibold tracking-tight text-[#203b35] sm:text-[34px]">Hola{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Aquí tienes una visión general de tus pacientes y actividad.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
          <Clock3 size={15} /> Datos de tu espacio clínico
        </div>
      </section>

      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_2px_12px_rgba(28,60,48,0.03)]">
          <div className="mb-4 flex items-center justify-between"><span className="text-sm text-muted-foreground">Pacientes asignados</span><span className="rounded-xl bg-secondary p-2 text-[#56806d]"><Users size={18} /></span></div>
          <p className="text-3xl font-semibold tracking-tight text-[#29443e]">{loading ? '—' : patients.length}</p>
          <p className="mt-1 text-xs text-muted-foreground/70">Total en tu cartera</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_2px_12px_rgba(28,60,48,0.03)]">
          <div className="mb-4 flex items-center justify-between"><span className="text-sm text-muted-foreground">Acompañamientos activos</span><span className="rounded-xl bg-secondary p-2 text-[#56806d]"><HeartPulse size={18} /></span></div>
          <p className="text-3xl font-semibold tracking-tight text-[#29443e]">{loading ? '—' : activePatients.length}</p>
          <p className="mt-1 text-xs text-muted-foreground/70">Con estado activo</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_2px_12px_rgba(28,60,48,0.03)]">
          <div className="mb-4 flex items-center justify-between"><span className="text-sm text-muted-foreground">Seguimientos pendientes</span><span className="rounded-xl bg-[#f5f1e8] p-2 text-[#a68b54]"><ClipboardList size={18} /></span></div>
          <p className="text-2xl font-semibold tracking-tight text-[#29443e]">—</p>
          <p className="mt-1 text-xs text-muted-foreground/70">Métrica aún no conectada</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_2px_12px_rgba(28,60,48,0.03)]">
          <div className="mb-4 flex items-center justify-between"><span className="text-sm text-muted-foreground">Alertas por revisar</span><span className="rounded-xl bg-[#f8eeee] p-2 text-[#b66d67]"><AlertCircle size={18} /></span></div>
          <p className="text-2xl font-semibold tracking-tight text-[#29443e]">—</p>
          <p className="mt-1 text-xs text-muted-foreground/70">Métrica aún no conectada</p>
        </div>
      </section>

      <section className="grid items-start gap-6 2xl:grid-cols-[minmax(0,1fr)_320px]">
        <div id="patients" className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_2px_12px_rgba(28,60,48,0.03)]">
          <div className="flex flex-col justify-between gap-4 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:px-6">
            <div><h2 className="text-base font-semibold text-[#29443e]">Mis pacientes</h2><p className="mt-1 text-xs text-muted-foreground/70">Personas asignadas con consentimiento activo</p></div>
            <label className="flex w-full items-center gap-2 rounded-xl border border-border bg-[#fbfcfb] px-3 py-2 sm:w-64"><Search size={16} className="text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar paciente..." className="w-full bg-transparent text-sm text-[#29443e] outline-none placeholder:text-muted-foreground/60" /></label>
          </div>
          {loading ? <div className="px-6 py-14 text-center text-sm text-muted-foreground">Cargando pacientes...</div> :
            filteredPatients.length === 0 ? <div className="px-6 py-14 text-center"><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-[#7b9588]"><Users size={22} /></div><p className="text-sm font-medium text-[#536a60]">{search ? 'No encontramos coincidencias' : 'Todavía no tienes pacientes asignados'}</p><p className="mt-1 text-xs text-muted-foreground/70">{search ? 'Prueba con otro nombre.' : 'Cuando tengas asignaciones activas, aparecerán aquí.'}</p></div> :
            <div className="divide-y divide-border">
              {filteredPatients.map((patient) => <button key={patient.id} type="button" onClick={() => router.push(`/dashboard/patients/${patient.id}`)} className="group flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-muted/40 sm:px-6">
                <div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-[#4c7765]">{initials(patient.display_name)}</div><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#345149]">{patient.display_name}</p><p className="mt-1 text-xs text-muted-foreground">{patient.assignment_role === 'primary' ? 'Terapeuta principal' : 'Paciente asignado'}</p></div></div>
                <div className="flex shrink-0 items-center gap-3"><span className={`rounded-full px-3 py-1 text-[11px] font-medium ${patient.care_status === 'active' ? 'bg-secondary text-[#5b846d]' : 'bg-muted text-muted-foreground'}`}>{statusLabel(patient.care_status)}</span><ChevronRight size={17} className="text-muted-foreground/50 transition group-hover:translate-x-0.5 group-hover:text-[#4c7765]" /></div>
              </button>)}
            </div>}
          <div className="flex items-center justify-between border-t border-border px-5 py-3 sm:px-6"><span className="text-xs text-muted-foreground/70">{loading ? ' ' : `${filteredPatients.length} de ${patients.length} pacientes`}</span><button type="button" onClick={() => document.getElementById('patients')?.scrollIntoView({ behavior: 'smooth' })} className="inline-flex items-center gap-1 text-xs font-semibold text-[#56806d]">Ver listado <ArrowUpRight size={14} /></button></div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_2px_12px_rgba(28,60,48,0.03)]">
            <div className="mb-3 flex items-center gap-2"><div className="rounded-lg bg-secondary p-2 text-[#56806d]"><ShieldCheck size={17} /></div><h3 className="text-sm font-semibold text-[#345149]">Privacidad y confianza</h3></div>
            <p className="text-xs leading-5 text-muted-foreground">La información clínica visible depende de los permisos y consentimientos compartidos por cada persona.</p>
            <div className="mt-4 flex items-center gap-2 border-t border-border pt-3 text-xs font-medium text-[#638574]"><CheckCircle2 size={15} /> Acceso sujeto a autorización</div>
          </div>
          <div className="rounded-2xl bg-[#eaf1ed] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6f8b7d]">NUMA Clinical</p>
            <h3 className="mt-2 text-base font-semibold leading-6 text-[#315247]">Acompañar también es observar el proceso.</h3>
            <p className="mt-2 text-xs leading-5 text-[#71887d]">Un espacio para dar continuidad al trabajo terapéutico, con claridad y respeto por cada historia.</p>
          </div>
        </aside>
      </section>
    </NumaShell>
  );
}
