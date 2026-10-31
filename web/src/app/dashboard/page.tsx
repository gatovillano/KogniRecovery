'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity, AlertCircle, ArrowUpRight, CalendarDays, CheckCircle2,
  ChevronRight, CircleHelp, ClipboardList, Clock3, HeartPulse,
  LayoutDashboard, LogOut, Search, Settings2, ShieldCheck, Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

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

const navigation = [
  { label: 'Resumen', icon: LayoutDashboard, active: true },
  { label: 'Mis pacientes', icon: Users, active: false },
  { label: 'Seguimiento', icon: Activity, active: false },
  { label: 'Agenda', icon: CalendarDays, active: false },
];

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

  const handleLogout = async () => {
    try {
      await api.logout();
      router.push('/login');
      router.refresh();
    } catch {
      toast.error('Error al cerrar sesión');
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7f6] text-[#203633]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[248px] flex-col border-r border-[#e5ebe7] bg-white px-5 py-7 lg:flex">
        <div className="mb-10 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#173f3a] text-lg font-semibold text-white">N</div>
          <div>
            <p className="text-xl font-semibold tracking-[0.12em] text-[#173f3a]">NUMA</p>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#82938d]">Clinical workspace</p>
          </div>
        </div>

        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9aa8a2]">Espacio clínico</p>
        <nav className="space-y-1">
          {navigation.map(({ label, icon: Icon, active }) => (
            <button key={label} type="button" onClick={() => label === 'Mis pacientes' && document.getElementById('patients')?.scrollIntoView({ behavior: 'smooth' })} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${active ? 'bg-[#eaf2ee] font-semibold text-[#1c5148]' : 'text-[#71817b] hover:bg-[#f5f8f6] hover:text-[#29443e]'}`}>
              <Icon size={18} strokeWidth={1.8} />
              {label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#4e8b78]" />}
            </button>
          ))}
        </nav>

        <div className="mt-9 border-t border-[#edf1ee] pt-6">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9aa8a2]">Preferencias</p>
          <button type="button" onClick={() => router.push('/dashboard/organization')} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#71817b] transition hover:bg-[#f5f8f6]">
            <Settings2 size={18} /> Administración del centro
          </button>
          <button type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-[#71817b] transition hover:bg-[#f5f8f6]">
            <CircleHelp size={18} /> Ayuda
          </button>
        </div>

        <div className="mt-auto rounded-2xl bg-[#f3f7f4] p-4">
          <div className="mb-2 flex items-center gap-2 text-[#477766]"><ShieldCheck size={16} /><span className="text-xs font-semibold">Espacio protegido</span></div>
          <p className="text-xs leading-5 text-[#82918a]">Accede únicamente a la información compartida contigo.</p>
        </div>
      </aside>

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-10 border-b border-[#e7ece8] bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
            <div className="lg:hidden">
              <p className="text-lg font-semibold tracking-[0.12em] text-[#173f3a]">NUMA</p>
              <p className="text-[9px] uppercase tracking-[0.18em] text-[#82938d]">Clinical</p>
            </div>
            <div className="hidden text-sm text-[#82918a] lg:block">Espacio de trabajo <span className="mx-2 text-[#c5d0ca]">/</span><span className="font-medium text-[#29443e]">Resumen</span></div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-[#29443e]">{user?.name ?? 'Terapeuta'}</p>
                <p className="text-xs text-[#8a9992]">{user?.email ?? 'Tu espacio profesional'}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#dceae2] text-sm font-semibold text-[#315e50]">{user?.name ? initials(user.name) : 'T'}</div>
              <button type="button" onClick={handleLogout} aria-label="Cerrar sesión" className="rounded-xl p-2 text-[#82918a] transition hover:bg-[#f1f5f2] hover:text-[#29443e]"><LogOut size={18} /></button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 sm:py-10">
          <section className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#719184]">Tu espacio de acompañamiento</p>
              <h1 className="text-3xl font-semibold tracking-tight text-[#203b35] sm:text-[34px]">Hola{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</h1>
              <p className="mt-2 text-sm text-[#82918a]">Aquí tienes una visión general de tus pacientes y actividad.</p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-[#e3eae5] bg-white px-3 py-2 text-xs text-[#71817b]">
              <Clock3 size={15} /> Datos de tu espacio clínico
            </div>
          </section>

          <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-[#e6ece7] bg-white p-5 shadow-[0_2px_12px_rgba(28,60,48,0.03)]">
              <div className="mb-4 flex items-center justify-between"><span className="text-sm text-[#82918a]">Pacientes asignados</span><span className="rounded-xl bg-[#edf4ef] p-2 text-[#56806d]"><Users size={18} /></span></div>
              <p className="text-3xl font-semibold tracking-tight text-[#29443e]">{loading ? '—' : patients.length}</p>
              <p className="mt-1 text-xs text-[#9aa7a1]">Total en tu cartera</p>
            </div>
            <div className="rounded-2xl border border-[#e6ece7] bg-white p-5 shadow-[0_2px_12px_rgba(28,60,48,0.03)]">
              <div className="mb-4 flex items-center justify-between"><span className="text-sm text-[#82918a]">Acompañamientos activos</span><span className="rounded-xl bg-[#edf4ef] p-2 text-[#56806d]"><HeartPulse size={18} /></span></div>
              <p className="text-3xl font-semibold tracking-tight text-[#29443e]">{loading ? '—' : activePatients.length}</p>
              <p className="mt-1 text-xs text-[#9aa7a1]">Con estado activo</p>
            </div>
            <div className="rounded-2xl border border-[#e6ece7] bg-white p-5 shadow-[0_2px_12px_rgba(28,60,48,0.03)]">
              <div className="mb-4 flex items-center justify-between"><span className="text-sm text-[#82918a]">Seguimientos pendientes</span><span className="rounded-xl bg-[#f5f1e8] p-2 text-[#a68b54]"><ClipboardList size={18} /></span></div>
              <p className="text-2xl font-semibold tracking-tight text-[#29443e]">—</p>
              <p className="mt-1 text-xs text-[#9aa7a1]">Métrica aún no conectada</p>
            </div>
            <div className="rounded-2xl border border-[#e6ece7] bg-white p-5 shadow-[0_2px_12px_rgba(28,60,48,0.03)]">
              <div className="mb-4 flex items-center justify-between"><span className="text-sm text-[#82918a]">Alertas por revisar</span><span className="rounded-xl bg-[#f8eeee] p-2 text-[#b66d67]"><AlertCircle size={18} /></span></div>
              <p className="text-2xl font-semibold tracking-tight text-[#29443e]">—</p>
              <p className="mt-1 text-xs text-[#9aa7a1]">Métrica aún no conectada</p>
            </div>
          </section>

          <section className="grid items-start gap-6 2xl:grid-cols-[minmax(0,1fr)_320px]">
            <div id="patients" className="overflow-hidden rounded-2xl border border-[#e6ece7] bg-white shadow-[0_2px_12px_rgba(28,60,48,0.03)]">
              <div className="flex flex-col justify-between gap-4 border-b border-[#edf1ee] px-5 py-5 sm:flex-row sm:items-center sm:px-6">
                <div><h2 className="text-base font-semibold text-[#29443e]">Mis pacientes</h2><p className="mt-1 text-xs text-[#94a19b]">Personas asignadas con consentimiento activo</p></div>
                <label className="flex w-full items-center gap-2 rounded-xl border border-[#e6ece7] bg-[#fbfcfb] px-3 py-2 sm:w-64"><Search size={16} className="text-[#9aa7a1]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar paciente..." className="w-full bg-transparent text-sm text-[#29443e] outline-none placeholder:text-[#aab5af]" /></label>
              </div>
              {loading ? <div className="px-6 py-14 text-center text-sm text-[#94a19b]">Cargando pacientes...</div> :
                filteredPatients.length === 0 ? <div className="px-6 py-14 text-center"><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f1f5f2] text-[#7b9588]"><Users size={22} /></div><p className="text-sm font-medium text-[#536a60]">{search ? 'No encontramos coincidencias' : 'Todavía no tienes pacientes asignados'}</p><p className="mt-1 text-xs text-[#9aa7a1]">{search ? 'Prueba con otro nombre.' : 'Cuando tengas asignaciones activas, aparecerán aquí.'}</p></div> :
                <div className="divide-y divide-[#f0f3f1]">
                  {filteredPatients.map((patient) => <button key={patient.id} type="button" onClick={() => router.push(`/dashboard/patients/${patient.id}`)} className="group flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-[#fafcfb] sm:px-6">
                    <div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eaf2ee] text-xs font-semibold text-[#4c7765]">{initials(patient.display_name)}</div><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#345149]">{patient.display_name}</p><p className="mt-1 text-xs text-[#94a19b]">{patient.assignment_role === 'primary' ? 'Terapeuta principal' : 'Paciente asignado'}</p></div></div>
                    <div className="flex shrink-0 items-center gap-3"><span className={`rounded-full px-3 py-1 text-[11px] font-medium ${patient.care_status === 'active' ? 'bg-[#edf5ef] text-[#5b846d]' : 'bg-[#f1f3f2] text-[#7e8b84]'}`}>{statusLabel(patient.care_status)}</span><ChevronRight size={17} className="text-[#b1bdb6] transition group-hover:translate-x-0.5 group-hover:text-[#4c7765]" /></div>
                  </button>)}
                </div>}
              <div className="flex items-center justify-between border-t border-[#edf1ee] px-5 py-3 sm:px-6"><span className="text-xs text-[#9aa7a1]">{loading ? ' ' : `${filteredPatients.length} de ${patients.length} pacientes`}</span><button type="button" onClick={() => document.getElementById('patients')?.scrollIntoView({ behavior: 'smooth' })} className="inline-flex items-center gap-1 text-xs font-semibold text-[#56806d]">Ver listado <ArrowUpRight size={14} /></button></div>
            </div>

            <aside className="space-y-5">
              <div className="rounded-2xl border border-[#e6ece7] bg-white p-5 shadow-[0_2px_12px_rgba(28,60,48,0.03)]">
                <div className="mb-3 flex items-center gap-2"><div className="rounded-lg bg-[#edf4ef] p-2 text-[#56806d]"><ShieldCheck size={17} /></div><h3 className="text-sm font-semibold text-[#345149]">Privacidad y confianza</h3></div>
                <p className="text-xs leading-5 text-[#82918a]">La información clínica visible depende de los permisos y consentimientos compartidos por cada persona.</p>
                <div className="mt-4 flex items-center gap-2 border-t border-[#edf1ee] pt-3 text-xs font-medium text-[#638574]"><CheckCircle2 size={15} /> Acceso sujeto a autorización</div>
              </div>
              <div className="rounded-2xl bg-[#eaf1ed] p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6f8b7d]">NUMA Clinical</p>
                <h3 className="mt-2 text-base font-semibold leading-6 text-[#315247]">Acompañar también es observar el proceso.</h3>
                <p className="mt-2 text-xs leading-5 text-[#71887d]">Un espacio para dar continuidad al trabajo terapéutico, con claridad y respeto por cada historia.</p>
              </div>
            </aside>
          </section>
          <footer className="mt-10 flex flex-col gap-2 border-t border-[#e5ebe7] pt-5 text-[11px] text-[#a0aca5] sm:flex-row sm:items-center sm:justify-between"><span>NUMA · Clinical workspace</span><span>Plataforma de acompañamiento y recuperación</span></footer>
        </main>
      </div>
    </div>
  );
}
