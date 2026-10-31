'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Activity,
  CalendarDays,
  CircleHelp,
  LayoutDashboard,
  LogOut,
  Settings2,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function NumaShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    let mounted = true;
    api
      .me()
      .then((response) => {
        if (mounted && response.success && response.data) {
          setUser(response.data.user);
        }
      })
      .catch(() => {
        // sin sesión: la capa de API redirige al login
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await api.logout();
      router.push('/login');
      router.refresh();
    } catch {
      toast.error('Error al cerrar sesión');
    }
  };

  const isHome = pathname === '/dashboard';
  const isPatients = pathname.startsWith('/dashboard/patients');
  const isAdmin = pathname.startsWith('/dashboard/organization');

  const navigation = [
    {
      label: 'Resumen',
      icon: LayoutDashboard,
      active: isHome,
      onClick: () => router.push('/dashboard'),
    },
    {
      label: 'Mis pacientes',
      icon: Users,
      active: isPatients,
      onClick: () => {
        if (isHome) {
          document.getElementById('patients')?.scrollIntoView({ behavior: 'smooth' });
        } else {
          router.push('/dashboard');
        }
      },
    },
    { label: 'Seguimiento', icon: Activity, active: false, onClick: undefined },
    { label: 'Agenda', icon: CalendarDays, active: false, onClick: undefined },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[248px] flex-col border-r border-border bg-card px-5 py-7 lg:flex">
        <div className="mb-10 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-lg font-semibold text-primary-foreground">
            N
          </div>
          <div>
            <p className="text-xl font-semibold tracking-[0.12em] text-primary">NUMA</p>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Clinical workspace
            </p>
          </div>
        </div>

        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Espacio clínico
        </p>
        <nav className="space-y-1">
          {navigation.map(({ label, icon: Icon, active, onClick }) => (
            <button
              key={label}
              type="button"
              onClick={onClick}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition ${
                active
                  ? 'bg-secondary font-semibold text-secondary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon size={18} strokeWidth={1.8} />
              {label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-ring" />}
            </button>
          ))}
        </nav>

        <div className="mt-9 border-t border-border pt-6">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Preferencias
          </p>
          <button
            type="button"
            onClick={() => router.push('/dashboard/organization')}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
              isAdmin
                ? 'bg-secondary font-semibold text-secondary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Settings2 size={18} /> Administración del centro
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <CircleHelp size={18} /> Ayuda
          </button>
        </div>

        <div className="mt-auto rounded-2xl bg-muted p-4">
          <div className="mb-2 flex items-center gap-2 text-[#477766]">
            <ShieldCheck size={16} />
            <span className="text-xs font-semibold">Espacio protegido</span>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            Accede únicamente a la información compartida contigo.
          </p>
        </div>
      </aside>

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-10 border-b border-border bg-card/90 backdrop-blur">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
            <div className="lg:hidden">
              <p className="text-lg font-semibold tracking-[0.12em] text-primary">NUMA</p>
              <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Clinical</p>
            </div>
            <div className="hidden text-sm text-muted-foreground lg:block">
              Espacio de trabajo <span className="mx-2 text-[#c5d0ca]">/</span>
              <span className="font-medium text-foreground">{title}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-foreground">{user?.name ?? 'Profesional'}</p>
                <p className="text-xs text-muted-foreground">{user?.email ?? 'Tu espacio profesional'}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                {user?.name ? initials(user.name) : 'P'}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Cerrar sesión"
                className="rounded-xl p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 sm:py-10">
          {children}
          <footer className="mt-10 flex flex-col gap-2 border-t border-border pt-5 text-[11px] text-muted-foreground/70 sm:flex-row sm:items-center sm:justify-between">
            <span>NUMA · Clinical workspace</span>
            <span>Plataforma de acompañamiento y recuperación</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
