'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, ApiClientError } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

type TabKey = 'patients' | 'invites' | 'members' | 'credentials' | 'deletions' | 'llm' | 'audit';

interface OrgPatient {
  id: string;
  organization_patient_id: string;
  display_name: string;
  care_status: string;
  enrolled_at?: string | null;
}

interface OrgMember {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  license_number?: string | null;
  verification_status?: string | null;
}

interface OrgInvite {
  id: string;
  patient_email: string;
  status: string;
  expires_at: string;
  professional_name?: string | null;
  created_by_name?: string | null;
}

interface AuditEntry {
  id: string;
  actor_name?: string | null;
  actor_role: string;
  action: string;
  resource_type: string;
  purpose: string;
  success: boolean;
  denial_reason?: string | null;
  created_at: string;
}

interface TherapistInvite {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  created_by_name?: string | null;
}

interface Credential {
  id: string;
  user_id: string;
  license_number: string;
  license_country: string;
  specialty?: string | null;
  verification_status: string;
  expires_at?: string | null;
  professional_name?: string | null;
  professional_email?: string | null;
}

interface DeletionRequest {
  id: string;
  patient_id: string;
  status: string;
  reason?: string | null;
  created_at: string;
  reviewed_at?: string | null;
}

interface LlmSettings {
  provider: string | null;
  model: string | null;
  base_url: string | null;
  api_version: string | null;
  has_api_key: boolean;
  api_key_masked: string | null;
}

const LLM_PROVIDER_OPTIONS: Array<{ key: string; label: string }> = [
  { key: 'openai', label: 'OpenAI' },
  { key: 'openrouter', label: 'Groq / OpenRouter' },
  { key: 'google', label: 'Google Gemini' },
  { key: 'anthropic', label: 'Anthropic (Claude)' },
  { key: 'ollama', label: 'Ollama Local' },
  { key: 'ollama_cloud', label: 'Ollama Cloud' },
  { key: 'kilocode', label: 'KiloCode Gateway' },
  { key: 'inception', label: 'Inception Labs' },
  { key: 'opencode', label: 'OpenCode Zen' },
];

const fmtDate = (value?: string | null): string => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return String(value);
  }
};

const ROLE_LABELS: Record<string, string> = {
  org_admin: 'Admin centro',
  clinical_lead: 'Resp. clínico',
  therapist: 'Terapeuta',
  auditor: 'Auditor',
};

export function OrgPanel() {
  const [tab, setTab] = useState<TabKey>('patients');
  const [patients, setPatients] = useState<OrgPatient[]>([]);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [invites, setInvites] = useState<OrgInvite[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Form de invitación
  const [invEmail, setInvEmail] = useState('');
  const [invProfessionalId, setInvProfessionalId] = useState('');
  const [invSending, setInvSending] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  // Form de vínculo directo
  const [linkEmail, setLinkEmail] = useState('');
  const [linkProfessionalId, setLinkProfessionalId] = useState('');
  const [linkSending, setLinkSending] = useState(false);

  // Invitaciones de personal
  const [profInvites, setProfInvites] = useState<TherapistInvite[]>([]);
  const [profInvEmail, setProfInvEmail] = useState('');
  const [profInvRole, setProfInvRole] = useState('therapist');
  const [profInvSending, setProfInvSending] = useState(false);
  const [profInvToken, setProfInvToken] = useState<string | null>(null);

  // Credenciales
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [credUserId, setCredUserId] = useState('');
  const [credLicense, setCredLicense] = useState('');
  const [credSpecialty, setCredSpecialty] = useState('');
  const [credExpires, setCredExpires] = useState('');
  const [credSending, setCredSending] = useState(false);

  // Solicitudes de borrado
  const [deletions, setDeletions] = useState<DeletionRequest[]>([]);

  // Configuración LLM
  const [llm, setLlm] = useState<LlmSettings>({ provider: null, model: null, base_url: null, api_version: null, has_api_key: false, api_key_masked: null });
  const [llmApiKey, setLlmApiKey] = useState('');
  const [llmBaseUrl, setLlmBaseUrl] = useState('');
  const [llmModel, setLlmModel] = useState('');
  const [llmModels, setLlmModels] = useState<Array<{ id: string }>>([]);
  const [llmLoadingModels, setLlmLoadingModels] = useState(false);
  const [llmSaving, setLlmSaving] = useState(false);

  const loadPatients = useCallback(async () => {
    try {
      const response = await api.get<{ patients: OrgPatient[] }>('/org/patients');
      if (response.success) setPatients(response.data?.patients ?? []);
    } catch {
      setPatients([]);
    }
  }, []);

  const loadMembers = useCallback(async () => {
    try {
      const response = await api.get<{ members: OrgMember[] }>('/org/members');
      if (response.success) setMembers(response.data?.members ?? []);
    } catch {
      setMembers([]);
    }
  }, []);

  const loadInvites = useCallback(async () => {
    try {
      const response = await api.get<{ invites: OrgInvite[] }>('/org/patients/invites');
      if (response.success) setInvites(response.data?.invites ?? []);
    } catch {
      setInvites([]);
    }
  }, []);

  const loadAudit = useCallback(async () => {
    try {
      const response = await api.get<{ entries: AuditEntry[] }>('/org/audit', { limit: 100 });
      if (response.success) setAudit(response.data?.entries ?? []);
    } catch {
      setAudit([]);
    }
  }, []);

  const loadProfInvites = useCallback(async () => {
    try {
      const response = await api.get<{ invites: TherapistInvite[] }>('/org/therapists/invites');
      if (response.success) setProfInvites(response.data?.invites ?? []);
    } catch {
      setProfInvites([]);
    }
  }, []);

  const loadCredentials = useCallback(async () => {
    try {
      const response = await api.get<{ credentials: Credential[] }>('/org/credentials');
      if (response.success) setCredentials(response.data?.credentials ?? []);
    } catch {
      setCredentials([]);
    }
  }, []);

  const loadDeletions = useCallback(async () => {
    try {
      const response = await api.get<{ requests: DeletionRequest[] }>('/org/data-deletion');
      if (response.success) setDeletions(response.data?.requests ?? []);
    } catch {
      setDeletions([]);
    }
  }, []);

  const loadLlm = useCallback(async () => {
    try {
      const response = await api.get<LlmSettings>('/org/llm-settings');
      if (response.success && response.data) {
        setLlm(response.data);
        setLlmModel(response.data.model ?? '');
        setLlmBaseUrl(response.data.base_url ?? '');
      }
    } catch {
      // sin permisos o error: dejar vacío
    }
  }, []);

  const loadTab = useCallback(async (key: TabKey) => {
    setLoading(true);
    try {
      if (key === 'patients') await loadPatients();
      else if (key === 'members') {
        await Promise.all([loadMembers(), loadProfInvites()]);
      } else if (key === 'credentials') await loadCredentials();
      else if (key === 'deletions') await loadDeletions();
      else if (key === 'llm') await loadLlm();
      else if (key === 'invites') await loadInvites();
      else await loadAudit();
    } finally {
      setLoading(false);
    }
  }, [loadPatients, loadMembers, loadInvites, loadAudit, loadProfInvites, loadCredentials, loadDeletions, loadLlm]);

  useEffect(() => {
    loadTab(tab);
  }, [tab, loadTab]);

  const createInvite = async () => {
    if (!invEmail.trim()) return;
    setInvSending(true);
    setGeneratedToken(null);
    try {
      const response = await api.post('/org/patients/invite', {
        patient_email: invEmail.trim(),
        professional_id: invProfessionalId || undefined,
      });
      if (response.success) {
        setGeneratedToken((response.data as any)?.token ?? null);
        setInvEmail('');
        setInvProfessionalId('');
        toast.success('Invitación creada');
        await loadInvites();
      } else {
        toast.error((response.error as any)?.message ?? 'No se pudo crear');
      }
    } catch {
      toast.error('No se pudo crear la invitación');
    } finally {
      setInvSending(false);
    }
  };

  const revokeInvite = async (id: string) => {
    try {
      await api.delete(`/org/patients/invites/${id}`);
      toast.success('Invitación revocada');
      await loadInvites();
    } catch {
      toast.error('No se pudo revocar');
    }
  };

  const linkPatient = async () => {
    if (!linkEmail.trim()) return;
    setLinkSending(true);
    try {
      const response = await api.post('/org/patients/link', {
        patient_email: linkEmail.trim(),
        professional_id: linkProfessionalId || undefined,
      });
      if (response.success) {
        setLinkEmail('');
        setLinkProfessionalId('');
        toast.success('Paciente vinculado');
        await loadPatients();
      } else {
        toast.error((response.error as any)?.message ?? 'No se pudo vincular');
      }
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : 'No se pudo vincular');
    } finally {
      setLinkSending(false);
    }
  };

  const setMemberStatus = async (member: OrgMember, status: string) => {
    try {
      await api.patch(`/org/members/${member.user_id}`, { status });
      toast.success(status === 'active' ? 'Miembro activado' : 'Miembro suspendido');
      await loadMembers();
    } catch {
      toast.error('No se pudo actualizar el miembro');
    }
  };

  const createProfInvite = async () => {
    if (!profInvEmail.trim()) return;
    setProfInvSending(true);
    setProfInvToken(null);
    try {
      const response = await api.post('/org/therapists/invite', {
        email: profInvEmail.trim(),
        role: profInvRole,
      });
      if (response.success) {
        setProfInvToken((response.data as any)?.token ?? null);
        setProfInvEmail('');
        toast.success('Invitación de personal creada');
        await loadProfInvites();
      } else {
        toast.error((response.error as any)?.message ?? 'No se pudo crear');
      }
    } catch {
      toast.error('No se pudo crear la invitación');
    } finally {
      setProfInvSending(false);
    }
  };

  const revokeProfInvite = async (id: string) => {
    try {
      await api.delete(`/org/therapists/invites/${id}`);
      toast.success('Invitación revocada');
      await loadProfInvites();
    } catch {
      toast.error('No se pudo revocar');
    }
  };

  const createCredential = async () => {
    if (!credUserId || !credLicense.trim()) return;
    setCredSending(true);
    try {
      const response = await api.post('/org/credentials', {
        user_id: credUserId,
        license_number: credLicense.trim(),
        specialty: credSpecialty || undefined,
        expires_at: credExpires || null,
      });
      if (response.success) {
        setCredLicense('');
        setCredSpecialty('');
        setCredExpires('');
        toast.success('Credencial registrada');
        await loadCredentials();
      } else {
        toast.error((response.error as any)?.message ?? 'No se pudo registrar');
      }
    } catch {
      toast.error('No se pudo registrar la credencial');
    } finally {
      setCredSending(false);
    }
  };

  const decideCredential = async (id: string, decision: 'verified' | 'rejected') => {
    try {
      await api.post(`/org/credentials/${id}/verify`, { decision });
      toast.success(decision === 'verified' ? 'Credencial verificada' : 'Credencial rechazada');
      await loadCredentials();
    } catch {
      toast.error('No se pudo actualizar la credencial');
    }
  };

  const reviewDeletion = async (id: string, decision: string) => {
    try {
      await api.post(`/org/data-deletion/${id}/review`, { decision });
      toast.success('Solicitud actualizada');
      await loadDeletions();
    } catch {
      toast.error('No se pudo actualizar la solicitud');
    }
  };

  const loadProviderModels = async () => {
    if (!llm.provider) return;
    setLlmLoadingModels(true);
    try {
      const response = await api.post<{ models: Array<{ id: string }> }>('/org/llm/models', {
        provider: llm.provider,
        api_key: llmApiKey || undefined,
        base_url: llmBaseUrl || undefined,
      });
      if (response.success) {
        setLlmModels(response.data?.models ?? []);
        toast.success(`${response.data?.models?.length ?? 0} modelos cargados`);
      } else {
        toast.error((response.error as any)?.message ?? 'No se pudieron cargar los modelos');
      }
    } catch {
      toast.error('No se pudieron cargar los modelos');
    } finally {
      setLlmLoadingModels(false);
    }
  };

  const saveLlm = async () => {
    if (!llm.provider) {
      toast.error('Selecciona un proveedor');
      return;
    }
    setLlmSaving(true);
    try {
      const response = await api.put('/org/llm-settings', {
        provider: llm.provider,
        model: llmModel || undefined,
        base_url: llmBaseUrl || undefined,
        api_key: llmApiKey,
      });
      if (response.success) {
        setLlmApiKey('');
        toast.success('Configuración LLM guardada');
        await loadLlm();
      } else {
        toast.error((response.error as any)?.message ?? 'No se pudo guardar');
      }
    } catch {
      toast.error('No se pudo guardar la configuración');
    } finally {
      setLlmSaving(false);
    }
  };

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: 'patients', label: 'Pacientes' },
    { key: 'invites', label: 'Invitaciones' },
    { key: 'members', label: 'Miembros' },
    { key: 'credentials', label: 'Credenciales' },
    { key: 'deletions', label: 'Borrados' },
    { key: 'llm', label: 'IA / LLM' },
    { key: 'audit', label: 'Auditoría' },
  ];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-1 border-b pb-3 mb-4">
          {tabs.map((t) => (
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

        {tab === 'patients' && (
          <div className="space-y-4">
            {generatedToken && (
              <div className="border rounded-md p-3 bg-gray-50 text-sm">
                <p className="font-medium mb-1">Token de invitación (cópialo para enviarlo al paciente):</p>
                <code className="break-all text-xs">{generatedToken}</code>
                <button
                  type="button"
                  className="ml-2 text-xs text-primary hover:underline"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedToken);
                    toast.success('Token copiado');
                  }}
                >
                  Copiar
                </button>
              </div>
            )}

            <div className="border rounded-md p-3 space-y-2 bg-gray-50/50">
              <p className="text-sm font-medium">Vincular paciente existente (cuenta ya creada en la app)</p>
              <div className="flex flex-wrap gap-2">
                <input
                  className="flex h-9 min-w-[220px] flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  placeholder="email del paciente"
                  value={linkEmail}
                  onChange={(e) => setLinkEmail(e.target.value)}
                />
                <select
                  className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                  value={linkProfessionalId}
                  onChange={(e) => setLinkProfessionalId(e.target.value)}
                >
                  <option value="">Terapeuta…</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.user_id}>
                      {m.name} ({ROLE_LABELS[m.role] ?? m.role})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={linkPatient}
                  disabled={linkSending || !linkEmail.trim()}
                  className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground disabled:opacity-50"
                >
                  {linkSending ? 'Vinculando…' : 'Vincular'}
                </button>
              </div>
            </div>

            <div className="border rounded-md p-3 space-y-2 bg-gray-50/50">
              <p className="text-sm font-medium">Invitar paciente nuevo o existente (envío por email/token)</p>
              <div className="flex flex-wrap gap-2">
                <input
                  className="flex h-9 min-w-[220px] flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  placeholder="email del paciente"
                  value={invEmail}
                  onChange={(e) => setInvEmail(e.target.value)}
                />
                <select
                  className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                  value={invProfessionalId}
                  onChange={(e) => setInvProfessionalId(e.target.value)}
                >
                  <option value="">Terapeuta…</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.user_id}>
                      {m.name} ({ROLE_LABELS[m.role] ?? m.role})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={createInvite}
                  disabled={invSending || !invEmail.trim()}
                  className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground disabled:opacity-50"
                >
                  {invSending ? 'Creando…' : 'Invitar'}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="py-2 pr-4 font-medium">Paciente</th>
                    <th className="py-2 pr-4 font-medium">Estado</th>
                    <th className="py-2 pr-4 font-medium">Vinculado</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p) => (
                    <tr key={p.organization_patient_id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{p.display_name}</td>
                      <td className="py-2 pr-4">{p.care_status}</td>
                      <td className="py-2 pr-4">{fmtDate(p.enrolled_at)}</td>
                    </tr>
                  ))}
                  {patients.length === 0 && (
                    <tr><td className="py-4 text-gray-500" colSpan={3}>Sin pacientes vinculados.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'invites' && (
          <div className="space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="py-2 pr-4 font-medium">Email</th>
                    <th className="py-2 pr-4 font-medium">Terapeuta</th>
                    <th className="py-2 pr-4 font-medium">Estado</th>
                    <th className="py-2 pr-4 font-medium">Expira</th>
                    <th className="py-2 pr-4 font-medium">Creada por</th>
                    <th className="py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {invites.map((i) => (
                    <tr key={i.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{i.patient_email}</td>
                      <td className="py-2 pr-4">{i.professional_name ?? '—'}</td>
                      <td className="py-2 pr-4">{i.status}</td>
                      <td className="py-2 pr-4">{fmtDate(i.expires_at)}</td>
                      <td className="py-2 pr-4">{i.created_by_name ?? '—'}</td>
                      <td className="py-2">
                        {i.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => revokeInvite(i.id)}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Revocar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {invites.length === 0 && (
                    <tr><td className="py-4 text-gray-500" colSpan={6}>Sin invitaciones.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'members' && (
          <div className="space-y-4">
            {profInvToken && (
              <div className="border rounded-md p-3 bg-gray-50 text-sm">
                <p className="font-medium mb-1">Token de invitación de personal (compártelo con el profesional):</p>
                <code className="break-all text-xs">{profInvToken}</code>
                <button
                  type="button"
                  className="ml-2 text-xs text-primary hover:underline"
                  onClick={() => {
                    navigator.clipboard.writeText(profInvToken);
                    toast.success('Token copiado');
                  }}
                >
                  Copiar
                </button>
              </div>
            )}

            <div className="border rounded-md p-3 space-y-2 bg-gray-50/50">
              <p className="text-sm font-medium">Invitar profesional (terapeuta/supervisor/admin)</p>
              <div className="flex flex-wrap gap-2">
                <input
                  className="flex h-9 min-w-[220px] flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  placeholder="email del profesional"
                  value={profInvEmail}
                  onChange={(e) => setProfInvEmail(e.target.value)}
                />
                <select
                  className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                  value={profInvRole}
                  onChange={(e) => setProfInvRole(e.target.value)}
                >
                  <option value="therapist">Terapeuta</option>
                  <option value="clinical_lead">Resp. clínico</option>
                  <option value="auditor">Auditor</option>
                  <option value="org_admin">Admin centro</option>
                </select>
                <button
                  type="button"
                  onClick={createProfInvite}
                  disabled={profInvSending || !profInvEmail.trim()}
                  className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground disabled:opacity-50"
                >
                  {profInvSending ? 'Creando…' : 'Invitar'}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="py-2 pr-4 font-medium">Nombre</th>
                    <th className="py-2 pr-4 font-medium">Email</th>
                    <th className="py-2 pr-4 font-medium">Rol</th>
                    <th className="py-2 pr-4 font-medium">Estado</th>
                    <th className="py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{m.name}</td>
                      <td className="py-2 pr-4">{m.email}</td>
                      <td className="py-2 pr-4">{ROLE_LABELS[m.role] ?? m.role}</td>
                      <td className="py-2 pr-4">{m.status}</td>
                      <td className="py-2">
                        {m.status === 'active' ? (
                          <button
                            type="button"
                            onClick={() => setMemberStatus(m, 'suspended')}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Suspender
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setMemberStatus(m, 'active')}
                            className="text-xs text-primary hover:underline"
                          >
                            Reactivar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {members.length === 0 && (
                    <tr><td className="py-4 text-gray-500" colSpan={5}>Sin miembros.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-2">
              <p className="text-sm font-medium mb-2">Invitaciones de personal enviadas</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="py-2 pr-4 font-medium">Email</th>
                      <th className="py-2 pr-4 font-medium">Rol</th>
                      <th className="py-2 pr-4 font-medium">Estado</th>
                      <th className="py-2 pr-4 font-medium">Expira</th>
                      <th className="py-2 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {profInvites.map((i) => (
                      <tr key={i.id} className="border-b last:border-0">
                        <td className="py-2 pr-4">{i.email}</td>
                        <td className="py-2 pr-4">{ROLE_LABELS[i.role] ?? i.role}</td>
                        <td className="py-2 pr-4">{i.status}</td>
                        <td className="py-2 pr-4">{fmtDate(i.expires_at)}</td>
                        <td className="py-2">
                          {i.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => revokeProfInvite(i.id)}
                              className="text-xs text-red-500 hover:underline"
                            >
                              Revocar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {profInvites.length === 0 && (
                      <tr><td className="py-4 text-gray-500" colSpan={5}>Sin invitaciones enviadas.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === 'credentials' && (
          <div className="space-y-4">
            <div className="border rounded-md p-3 space-y-2 bg-gray-50/50">
              <p className="text-sm font-medium">Registrar credencial profesional</p>
              <div className="flex flex-wrap gap-2">
                <select
                  className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                  value={credUserId}
                  onChange={(e) => setCredUserId(e.target.value)}
                >
                  <option value="">Profesional…</option>
                  {members.filter((m) => m.role === 'therapist' || m.role === 'clinical_lead').map((m) => (
                    <option key={m.id} value={m.user_id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
                <input
                  className="flex h-9 min-w-[160px] flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  placeholder="N° de licencia"
                  value={credLicense}
                  onChange={(e) => setCredLicense(e.target.value)}
                />
                <input
                  className="flex h-9 min-w-[160px] flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  placeholder="Especialidad"
                  value={credSpecialty}
                  onChange={(e) => setCredSpecialty(e.target.value)}
                />
                <input
                  type="date"
                  className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                  title="Vencimiento"
                  value={credExpires}
                  onChange={(e) => setCredExpires(e.target.value)}
                />
                <button
                  type="button"
                  onClick={createCredential}
                  disabled={credSending || !credUserId || !credLicense.trim()}
                  className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground disabled:opacity-50"
                >
                  {credSending ? 'Guardando…' : 'Registrar'}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="py-2 pr-4 font-medium">Profesional</th>
                    <th className="py-2 pr-4 font-medium">Licencia</th>
                    <th className="py-2 pr-4 font-medium">Especialidad</th>
                    <th className="py-2 pr-4 font-medium">Estado</th>
                    <th className="py-2 pr-4 font-medium">Vence</th>
                    <th className="py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {credentials.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{c.professional_name ?? '—'}</td>
                      <td className="py-2 pr-4">{c.license_number}</td>
                      <td className="py-2 pr-4">{c.specialty ?? '—'}</td>
                      <td className="py-2 pr-4">{c.verification_status}</td>
                      <td className="py-2 pr-4">{fmtDate(c.expires_at)}</td>
                      <td className="py-2">
                        {c.verification_status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => decideCredential(c.id, 'verified')}
                              className="text-xs text-green-600 hover:underline"
                            >
                              Verificar
                            </button>
                            <button
                              type="button"
                              onClick={() => decideCredential(c.id, 'rejected')}
                              className="text-xs text-red-500 hover:underline"
                            >
                              Rechazar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {credentials.length === 0 && (
                    <tr><td className="py-4 text-gray-500" colSpan={6}>Sin credenciales registradas.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'deletions' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 pr-4 font-medium">Paciente (ID)</th>
                  <th className="py-2 pr-4 font-medium">Motivo</th>
                  <th className="py-2 pr-4 font-medium">Estado</th>
                  <th className="py-2 pr-4 font-medium">Solicitada</th>
                  <th className="py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {deletions.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-mono text-xs">{r.patient_id.slice(0, 8)}…</td>
                    <td className="py-2 pr-4">{r.reason ?? '—'}</td>
                    <td className="py-2 pr-4">{r.status}</td>
                    <td className="py-2 pr-4">{fmtDate(r.created_at)}</td>
                    <td className="py-2">
                      {(r.status === 'requested' || r.status === 'in_progress') && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => reviewDeletion(r.id, 'in_progress')}
                            className="text-xs text-primary hover:underline"
                          >
                            En proceso
                          </button>
                          <button
                            type="button"
                            onClick={() => reviewDeletion(r.id, 'completed')}
                            className="text-xs text-green-600 hover:underline"
                          >
                            Completar
                          </button>
                          <button
                            type="button"
                            onClick={() => reviewDeletion(r.id, 'rejected')}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Rechazar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {deletions.length === 0 && (
                  <tr><td className="py-4 text-gray-500" colSpan={5}>Sin solicitudes de borrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'llm' && (
          <div className="space-y-4 max-w-2xl">
            <div className="border rounded-md p-3 space-y-3 bg-gray-50/50">
              <p className="text-sm font-medium">Proveedor y modelo del asistente (mismos proveedores que KogniTerm)</p>

              <div>
                <label className="text-xs text-gray-500">Proveedor</label>
                <select
                  className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  value={llm.provider ?? ''}
                  onChange={(e) => {
                    setLlm((prev) => ({ ...prev, provider: e.target.value }));
                    setLlmModels([]);
                    setLlmModel('');
                  }}
                >
                  <option value="">Seleccionar…</option>
                  {LLM_PROVIDER_OPTIONS.map((p) => (
                    <option key={p.key} value={p.key}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500">
                  API Key {llm.has_api_key && <span className="text-green-600">({llm.api_key_masked} guardada)</span>}
                </label>
                <input
                  type="password"
                  className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  placeholder={llm.has_api_key ? 'Dejar vacío para conservar la actual' : 'API key del proveedor'}
                  value={llmApiKey}
                  onChange={(e) => setLlmApiKey(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-gray-500">Base URL (opcional; por defecto la del proveedor)</label>
                <input
                  className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  placeholder="https://…"
                  value={llmBaseUrl}
                  onChange={(e) => setLlmBaseUrl(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-end gap-2">
                <div className="flex-1 min-w-[220px]">
                  <label className="text-xs text-gray-500">Modelo</label>
                  <input
                    list="llm-model-options"
                    className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    placeholder="Escribe o carga los modelos desde la API"
                    value={llmModel}
                    onChange={(e) => setLlmModel(e.target.value)}
                  />
                  <datalist id="llm-model-options">
                    {llmModels.map((m) => (
                      <option key={m.id} value={m.id} />
                    ))}
                  </datalist>
                </div>
                <button
                  type="button"
                  onClick={loadProviderModels}
                  disabled={llmLoadingModels || !llm.provider}
                  className="px-3 py-1.5 text-sm rounded-md border hover:bg-gray-100 disabled:opacity-50"
                >
                  {llmLoadingModels ? 'Cargando…' : 'Cargar modelos de la API'}
                </button>
              </div>

              {llmModels.length > 0 && (
                <p className="text-xs text-gray-500">{llmModels.length} modelos disponibles (autocompletado).</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={saveLlm}
                  disabled={llmSaving || !llm.provider}
                  className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground disabled:opacity-50"
                >
                  {llmSaving ? 'Guardando…' : 'Guardar configuración'}
                </button>
                {llm.has_api_key && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await api.put('/org/llm-settings', { provider: llm.provider, api_key: '' });
                        setLlmApiKey('');
                        toast.success('API key eliminada');
                        await loadLlm();
                      } catch {
                        toast.error('No se pudo eliminar la key');
                      }
                    }}
                    className="px-3 py-1.5 text-sm rounded-md text-red-500 hover:underline"
                  >
                    Quitar API key
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'audit' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 pr-4 font-medium">Fecha</th>
                  <th className="py-2 pr-4 font-medium">Actor</th>
                  <th className="py-2 pr-4 font-medium">Acción</th>
                  <th className="py-2 pr-4 font-medium">Recurso</th>
                  <th className="py-2 pr-4 font-medium">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {audit.map((e) => (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{fmtDate(e.created_at)}</td>
                    <td className="py-2 pr-4">{e.actor_name ?? e.actor_role}</td>
                    <td className="py-2 pr-4">{e.action}</td>
                    <td className="py-2 pr-4">{e.resource_type}</td>
                    <td className="py-2">
                      {e.success ? (
                        <span className="text-green-600">Permitido</span>
                      ) : (
                        <span className="text-red-600">Denegado {e.denial_reason ? `(${e.denial_reason})` : ''}</span>
                      )}
                    </td>
                  </tr>
                ))}
                {audit.length === 0 && (
                  <tr><td className="py-4 text-gray-500" colSpan={5}>Sin registros.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {loading && <p className="text-sm text-gray-500 py-2 text-center">Cargando…</p>}
      </CardContent>
    </Card>
  );
}
