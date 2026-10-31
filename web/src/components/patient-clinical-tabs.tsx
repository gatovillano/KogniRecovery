'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

type TabKey = 'checkins' | 'cravings' | 'medications' | 'consumption' | 'journal' | 'chatbot' | 'alerts' | 'notes';

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'checkins', label: 'Check-ins' },
  { key: 'cravings', label: 'Cravings' },
  { key: 'medications', label: 'Medicamentos' },
  { key: 'consumption', label: 'Consumo' },
  { key: 'journal', label: 'Diario' },
  { key: 'chatbot', label: 'Chatbot' },
  { key: 'alerts', label: 'Alertas' },
  { key: 'notes', label: 'Notas' },
];

const fmt = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '—';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const fmtDate = (value: unknown): string => {
  if (!value) return '—';
  try {
    return new Date(String(value)).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return String(value);
  }
};

const tabEndpoint = (tab: TabKey): string =>
  tab === 'chatbot' ? 'chatbot-summary' : tab;

interface TabConsentSummary {
  detail_level?: string;
  expires_at?: string | null;
}

interface TabPayload {
  items: unknown[];
  consent?: { summary?: TabConsentSummary };
  unavailable_categories?: string[];
  error?: string;
}

type Row = Record<string, unknown>;

type TabDataMap = Partial<Record<TabKey, TabPayload>>;

interface AlertRow {
  id: string;
  severity: string;
  status: string;
  summary: string;
  created_at: string;
}

interface NoteRow {
  id: string;
  content: string;
  author_name?: string;
  created_at: string;
  visibility?: string;
}

export function PatientClinicalTabs({ patientId }: { patientId: string }) {
  const [tab, setTab] = useState<TabKey>('checkins');
  const [data, setData] = useState<TabDataMap>({});
  const [loadedTab, setLoadedTab] = useState<TabKey | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const loading = loadedTab !== tab;

  useEffect(() => {
    let cancelled = false;

    api
      .get(`/therapist/patients/${patientId}/${tabEndpoint(tab)}`)
      .then((response) => {
        if (cancelled) return;
        if (response.success) {
          if (tab === 'notes') {
            const notes = (response.data as { notes?: unknown[] })?.notes ?? [];
            setData((prev) => ({ ...prev, notes: { items: notes } }));
          } else {
            setData((prev) => ({ ...prev, [tab]: response.data as TabPayload }));
          }
        }
      })
      .catch((error) => {
        if (cancelled) return;
        const code = error instanceof Error ? error.message : String(error);
        setData((prev) => ({
          ...prev,
          [tab]: { error: code, consent: { summary: null }, items: [] },
        }));
        toast.error('No se pudo cargar esta sección (¿no compartida?)');
      })
      .finally(() => {
        if (!cancelled) setLoadedTab(tab);
      });

    return () => {
      cancelled = true;
    };
  }, [tab, patientId]);

  const current = data[tab];
  const items = (current?.items ?? []) as Row[];
  const consent = current?.consent;
  const unavailable = current?.unavailable_categories ?? [];

  const renderTable = (columns: Array<{ key: string; label: string; render?: (row: Row) => React.ReactNode }>) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            {columns.map((c) => (
              <th key={c.key} className="py-2 pr-4 font-medium">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((row, idx) => (
            <tr key={String(row.id ?? idx)} className="border-b last:border-0">
              {columns.map((c) => (
                <td key={c.key} className="py-2 pr-4 align-top">
                  {c.render ? c.render(row) : fmt(row[c.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderContent = () => {
    if (current?.error) {
      return (
        <p className="text-sm text-amber-600 py-4">
          Esta categoría no está compartida por el paciente (o el acceso fue revocado).
        </p>
      );
    }

    if (items.length === 0) {
      return <p className="text-sm text-gray-500 py-4">Sin registros.</p>;
    }

    switch (tab) {
      case 'checkins':
        return renderTable([
          { key: 'checkin_date', label: 'Fecha', render: (r) => fmt(r.checkin_date) },
          { key: 'mood_score', label: 'Ánimo', render: (r) => `${fmt(r.mood_score)}/10` },
          { key: 'anxiety_score', label: 'Ansiedad', render: (r) => `${fmt(r.anxiety_score)}/10` },
          { key: 'sleep_hours', label: 'Sueño' },
          {
            key: 'consumed_substances',
            label: 'Consumo',
            render: (r) =>
              Array.isArray(r.consumed_substances) && r.consumed_substances.length > 0
                ? 'Sí'
                : 'No',
          },
          {
            key: 'consumed_quantity',
            label: 'Cantidad',
            render: (r) => {
              if (!Array.isArray(r.consumed_substances) || r.consumed_substances.length === 0) {
                return '—';
              }
              return r.consumed_substances
                .map((c: { name?: string | null; quantity?: string | null }) =>
                  [c?.name, c?.quantity]
                    .filter(Boolean)
                    .join(' · ')
                )
                .filter(Boolean)
                .join(', ') || '—';
            },
          },
          {
            key: 'risk_description',
            label: 'Desencadenante',
            render: (r) =>
              r.risk_description ? String(r.risk_description).slice(0, 80) : '—',
          },
          { key: 'notes', label: 'Notas', render: (r) => (r.notes ? String(r.notes).slice(0, 80) : '—') },
        ]);
      case 'cravings':
        return renderTable([
          { key: 'craving_start_time', label: 'Fecha', render: (r) => fmtDate(r.craving_start_time) },
          { key: 'substance_name', label: 'Sustancia' },
          { key: 'intensity', label: 'Intensidad', render: (r) => `${fmt(r.intensity)}/10` },
          { key: 'status', label: 'Resultado' },
          { key: 'notes', label: 'Notas', render: (r) => (r.notes ? String(r.notes).slice(0, 80) : '—') },
        ]);
      case 'medications':
        return renderTable([
          { key: 'name', label: 'Medicamento' },
          { key: 'dosage', label: 'Dosis' },
          { key: 'schedule_time', label: 'Horario', render: (r) => String(r.schedule_time ?? '').slice(0, 5) },
          { key: 'last_taken_date', label: 'Última toma', render: (r) => fmt(r.last_taken_date) },
          { key: 'last_status', label: 'Estado' },
        ]);
      case 'consumption':
        return renderTable([
          { key: 'occurred_at', label: 'Fecha', render: (r) => fmtDate(r.occurred_at) },
          {
            key: 'kind',
            label: 'Tipo',
            render: (r) => (r.kind === 'dose' ? 'Dosis' : r.kind === 'checkin' ? 'Check-in' : 'Evento'),
          },
          { key: 'substance_name', label: 'Sustancia' },
          {
            key: 'quantity',
            label: 'Cantidad',
            render: (r) =>
              r.unit ? `${fmt(r.quantity)} ${fmt(r.unit)}` : fmt(r.quantity),
          },
          {
            key: 'context_notes',
            label: 'Desencadenante',
            render: (r) =>
              r.kind === 'checkin' && r.context_notes
                ? String(r.context_notes).slice(0, 80)
                : '—',
          },
          { key: 'craving_intensity', label: 'Antojo', render: (r) => (r.craving_intensity != null ? `${fmt(r.craving_intensity)}/10` : '—') },
        ]);
      case 'journal':
        return renderTable([
          { key: 'entry_date', label: 'Fecha', render: (r) => fmt(r.entry_date) },
          { key: 'kind', label: 'Tipo', render: (r) => String(r.kind).replace('_', ' ') },
          { key: 'text', label: 'Contenido', render: (r) => String(r.text).slice(0, 120) },
        ]);
      case 'chatbot':
        return renderTable([
          { key: 'last_message_at', label: 'Fecha', render: (r) => fmtDate(r.last_message_at ?? r.started_at) },
          { key: 'title', label: 'Tema' },
          { key: 'scenario_type', label: 'Escenario' },
          { key: 'message_count', label: 'Mensajes' },
          { key: 'user_satisfaction', label: 'Satisfacción', render: (r) => (r.user_satisfaction != null ? `${r.user_satisfaction}/5` : '—') },
        ]);
      case 'alerts':
        return renderAlerts();
      case 'notes':
        return renderNotes();
      default:
        return null;
    }
  };

  const createNote = async () => {
    const content = noteDraft.trim();
    if (!content) return;
    try {
      await api.post(`/therapist/patients/${patientId}/notes`, { content });
      setNoteDraft('');
      toast.success('Nota guardada');
      // Recargar
      setData((prev) => ({ ...prev, notes: undefined }));
      setTab('notes');
    } catch {
      toast.error('No se pudo guardar la nota');
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      await api.delete(`/therapist/patients/${patientId}/notes/${noteId}`);
      toast.success('Nota eliminada');
      setData((prev) => ({ ...prev, notes: undefined }));
      setTab('notes');
    } catch {
      toast.error('No se pudo eliminar la nota');
    }
  };

  const renderNotes = () => (
    <div className="space-y-3">
      <div className="space-y-2">
        <textarea
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          placeholder="Escribe una nota privada sobre este paciente…"
          className="w-full min-h-[90px] rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <button
          type="button"
          onClick={createNote}
          disabled={!noteDraft.trim()}
          className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground disabled:opacity-50"
        >
          Guardar nota
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500 py-2">Sin notas.</p>
      ) : (
        <div className="space-y-2">
          {(items as unknown as NoteRow[]).map((note) => (
            <div key={note.id} className="border rounded-md p-3">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs text-gray-500">
                  {note.author_name ?? 'Profesional'} · {fmtDate(note.created_at)}
                  {note.visibility === 'private' ? ' · Privada' : ' · Equipo'}
                </span>
                <button
                  type="button"
                  onClick={() => deleteNote(note.id)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Eliminar
                </button>
              </div>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const severityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const statusLabel = (status: string): string => {
    switch (status) {
      case 'open': return 'Abierta';
      case 'acknowledged': return 'Reconocida';
      case 'escalated': return 'Escalada';
      case 'closed': return 'Cerrada';
      case 'false_positive': return 'Falso positivo';
      default: return status;
    }
  };

  const runAlertAction = async (alertId: string, action: 'acknowledge' | 'escalate') => {
    try {
      await api.post(`/therapist/alerts/${alertId}/${action}`);
      toast.success(action === 'acknowledge' ? 'Alerta reconocida' : 'Alerta escalada');
      // Recargar la pestaña actual
      setData((prev) => ({ ...prev, alerts: undefined }));
      setTab('alerts');
    } catch {
      toast.error('No se pudo actualizar la alerta');
    }
  };

  const renderAlerts = () => (
    <div className="space-y-2">
      {(items as unknown as AlertRow[]).map((alert) => (
        <div key={alert.id} className="border rounded-md p-3 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${severityColor(alert.severity)}`}>
                {alert.severity}
              </span>
              <span className="text-xs text-gray-500">{statusLabel(alert.status)}</span>
              <span className="text-xs text-gray-400">{fmtDate(alert.created_at)}</span>
            </div>
            <p className="text-sm mt-1 text-gray-800">{alert.summary}</p>
          </div>
          {(alert.status === 'open' || alert.status === 'acknowledged') && (
            <div className="flex flex-col gap-1 shrink-0">
              <button
                type="button"
                onClick={() => runAlertAction(alert.id, 'acknowledge')}
                className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
              >
                Reconocer
              </button>
              <button
                type="button"
                onClick={() => runAlertAction(alert.id, 'escalate')}
                className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50"
              >
                Escalar
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-1 border-b pb-3 mb-3">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={
                'px-3 py-1.5 text-sm rounded-md transition-colors ' +
                (tab === t.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-gray-600 hover:bg-gray-100')
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {consent?.summary && (
          <p className="text-xs text-gray-500 mb-2">
            Nivel de detalle: {consent.summary.detail_level}
            {consent.summary.expires_at
              ? ` · vence ${fmtDate(consent.summary.expires_at)}`
              : ''}
          </p>
        )}

        {loading ? <p className="text-sm text-gray-500 py-4">Cargando…</p> : renderContent()}

        {unavailable.length > 0 && !current?.error && (
          <p className="text-xs text-gray-400 mt-2">
            No disponibles: {unavailable.join(', ')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
