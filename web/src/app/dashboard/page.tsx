'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Users, FileText, AlertCircle, LogOut, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

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

export default function DashboardPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [meResponse, patientsResponse] = await Promise.all([
        api.me(),
        api.get<{ organization_id: string; patients: Patient[] }>('/therapist/patients'),
      ]);

      if (meResponse.success && meResponse.data) {
        setUser(meResponse.data.user);
      }

      if (patientsResponse.success && patientsResponse.data) {
        setPatients(patientsResponse.data.patients);
      }
    } catch (error) {
      console.error('Error cargando panel:', error);
      toast.error('No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      router.push('/login');
      router.refresh();
    } catch (error) {
      toast.error('Error al cerrar sesión');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Panel de Terapeutas</h1>
            <p className="text-sm text-gray-600">
              {user ? `${user.name} · ${user.email}` : 'Numa'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push('/dashboard/organization')}>
              <Building2 className="h-4 w-4 mr-2" />
              Administración del centro
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Mis Pacientes
            </CardTitle>
            <CardDescription>
              Pacientes asignados con consentimiento activo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-gray-500">Cargando...</p>
            ) : patients.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No hay pacientes asignados</p>
              </div>
            ) : (
              <div className="divide-y">
                {patients.map((patient) => (
                  <div
                    key={patient.id}
                    className="py-4 flex items-center justify-between hover:bg-gray-50 px-4 -mx-4 cursor-pointer"
                    onClick={() => router.push(`/dashboard/patients/${patient.id}`)}
                  >
                    <div>
                      <p className="font-medium text-gray-900">{patient.display_name}</p>
                      <p className="text-sm text-gray-500">
                        Estado: {patient.care_status === 'active' ? 'Activo' : patient.care_status}
                        {patient.assignment_role && ` • ${patient.assignment_role === 'primary' ? 'Terapeuta principal' : 'Equipo'}`}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Ver detalles
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
