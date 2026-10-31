'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PatientClinicalTabs } from '@/components/patient-clinical-tabs';
import { api } from '@/lib/api';
import { ArrowLeft, FileText, Shield, Activity } from 'lucide-react';
import { toast } from 'sonner';

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
    consents: any[];
  };
  checkins: any[];
  checkins_error: string | null;
}

export function PatientDetailClient({ patientId }: { patientId: string }) {
  const router = useRouter();

  const [overview, setOverview] = useState<PatientOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverview();
  }, [patientId]);

  const loadOverview = async () => {
    try {
      const response = await api.get<PatientOverview>(`/therapist/patients/${patientId}/overview`);
      if (response.success && response.data) {
        setOverview(response.data);
      } else {
        toast.error(response.error?.message || 'Error al cargar información');
      }
    } catch (error) {
      console.error('Error loading overview:', error);
      toast.error('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>No se pudo cargar la información</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button variant="ghost" onClick={() => router.push('/dashboard')} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a pacientes
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">{overview.patient.display_name}</h1>
          <p className="text-sm text-gray-600">
            Estado: {overview.patient.care_status === 'active' ? 'Activo' : overview.patient.care_status}
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Consentimiento
              </CardTitle>
              <CardDescription>Datos compartidos por el paciente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium">Categorías compartidas:</p>
                {Object.keys(overview.consent.sharedCategories).length === 0 ? (
                  <p className="text-sm text-gray-500">Ninguna categoría compartida</p>
                ) : (
                  <ul className="space-y-1">
                    {Object.entries(overview.consent.sharedCategories).map(([cat, level]) => (
                      <li key={cat} className="text-sm flex justify-between">
                        <span>{cat}</span>
                        <span className="text-gray-500">{level}</span>
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
                <Activity className="h-5 w-5" />
                Check-ins recientes
              </CardTitle>
              <CardDescription>Últimos 7 días</CardDescription>
            </CardHeader>
            <CardContent>
              {overview.checkins_error ? (
                <p className="text-sm text-amber-600">
                  {overview.checkins_error === 'CONSENT_REQUIRED'
                    ? 'El paciente no ha compartido los check-ins'
                    : overview.checkins_error}
                </p>
              ) : overview.checkins.length === 0 ? (
                <p className="text-sm text-gray-500">No hay check-ins</p>
              ) : (
                <div className="space-y-2">
                  {overview.checkins.slice(0, 5).map((checkin: any, idx: number) => (
                    <div key={idx} className="text-sm border-b pb-2">
                      <p className="font-medium">{checkin.checkin_date}</p>
                      <p className="text-gray-600">
                        Ánimo: {checkin.mood_score}/10 | Ansiedad: {checkin.anxiety_score}/10
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Registro clínico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PatientClinicalTabs patientId={patientId} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
