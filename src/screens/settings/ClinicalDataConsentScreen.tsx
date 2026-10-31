/**
 * ClinicalDataConsentScreen - Centro de consentimiento clínico del paciente
 *
 * Permite ver los centros vinculados, elegir categoría por categoría qué
 * datos se comparten, con qué nivel de detalle y revocar el acceso en
 * cualquier momento. También muestra quién accedió a la información.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useTheme } from '@theme/ThemeContext';
import { Card, Button } from '@components';
import { api } from '@services/api';

type DetailLevel = 'aggregate' | 'summary' | 'detailed' | 'full';

interface CatalogCategory {
  key: string;
  label: string;
  description: string;
  includes: string[];
  required_detail_level: DetailLevel;
  purpose: 'treatment' | 'safety';
  depends_on: string[];
  required_for_care: boolean;
}

interface ConsentCategory {
  category: string;
  detail_level: DetailLevel;
  enabled: boolean;
}

interface Consent {
  id: string;
  organization_id: string;
  grantee_type: 'organization' | 'professional';
  grantee_id: string;
  purpose: 'treatment' | 'safety';
  status: 'granted' | 'revoked' | 'expired';
  history_days?: number | null;
  expires_at?: string | null;
  categories: ConsentCategory[];
}

interface CareLink {
  organization: { id: string; name: string; status: string };
  care_status: string;
  enrolled_at?: string | null;
  assigned_professional: { id: string; name: string } | null;
  active_consents: Array<{
    id: string;
    grantee_type: 'organization' | 'professional';
    grantee_id: string;
    purpose: string;
    expires_at?: string | null;
    categories: ConsentCategory[];
  }>;
}

interface AccessEntry {
  id: string;
  actor_name: string;
  actor_role: string;
  organization_name?: string | null;
  action: string;
  resource_type: string;
  purpose: string;
  success: boolean;
  created_at: string;
}

interface PendingInvite {
  id: string;
  organization_id: string;
  organization_name: string;
  patient_email: string;
  status: string;
  expires_at: string;
  professional_name?: string | null;
}

const DETAIL_OPTIONS: DetailLevel[] = ['aggregate', 'summary', 'detailed', 'full'];
const DETAIL_LABELS: Record<DetailLevel, string> = {
  aggregate: 'Agregado',
  summary: 'Resumen',
  detailed: 'Detallado',
  full: 'Completo',
};
const DETAIL_RANK: Record<DetailLevel, number> = {
  aggregate: 0,
  summary: 1,
  detailed: 2,
  full: 3,
};

const formatDate = (value?: string | null): string => {
  if (!value) return 'sin vencimiento';
  try {
    return new Date(value).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return 'sin vencimiento';
  }
};

export const ClinicalDataConsentScreen: React.FC = () => {
  const { theme } = useTheme();

  const [links, setLinks] = useState<CareLink[]>([]);
  const [consents, setConsents] = useState<Consent[]>([]);
  const [catalog, setCatalog] = useState<CatalogCategory[]>([]);
  const [accessLog, setAccessLog] = useState<AccessEntry[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const [levels, setLevels] = useState<Record<string, DetailLevel>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedLink = useMemo(
    () => links.find((link) => link.organization.id === selectedOrgId) ?? null,
    [links, selectedOrgId]
  );

  const treatmentConsent = useMemo(() => {
    if (!selectedLink) return null;
    const granteeType = selectedLink.assigned_professional
      ? 'professional'
      : 'organization';
    const granteeId =
      selectedLink.assigned_professional?.id ?? selectedLink.organization.id;

    return (
      consents.find(
        (consent) =>
          consent.status === 'granted' &&
          consent.purpose === 'treatment' &&
          consent.organization_id === selectedLink.organization.id &&
          consent.grantee_type === granteeType &&
          consent.grantee_id === granteeId
      ) ?? null
    );
  }, [consents, selectedLink]);

  const safetyConsent = useMemo(() => {
    if (!selectedLink) return null;
    return (
      consents.find(
        (consent) =>
          consent.status === 'granted' &&
          consent.purpose === 'safety' &&
          consent.organization_id === selectedLink.organization.id &&
          consent.grantee_type === 'organization'
      ) ?? null
    );
  }, [consents, selectedLink]);

  const treatmentCatalog = useMemo(
    () => catalog.filter((category) => category.purpose === 'treatment'),
    [catalog]
  );

  const riskCategory = useMemo(
    () => catalog.find((category) => category.purpose === 'safety') ?? null,
    [catalog]
  );

  const applyConsentState = useCallback(
    (link: CareLink | null, allConsents: Consent[], allCatalog: CatalogCategory[]) => {
      if (!link) {
        setEnabled({});
        setLevels({});
        return;
      }

      const granteeType = link.assigned_professional ? 'professional' : 'organization';
      const granteeId =
        link.assigned_professional?.id ?? link.organization.id;
      const current = allConsents.find(
        (consent) =>
          consent.status === 'granted' &&
          consent.purpose === 'treatment' &&
          consent.organization_id === link.organization.id &&
          consent.grantee_type === granteeType &&
          consent.grantee_id === granteeId
      );

      const nextEnabled: Record<string, boolean> = {};
      const nextLevels: Record<string, DetailLevel> = {};

      for (const category of allCatalog) {
        if (category.purpose !== 'treatment') continue;
        const existing = current?.categories.find(
          (item) => item.category === category.key
        );
        nextEnabled[category.key] = Boolean(existing?.enabled);
        nextLevels[category.key] =
          existing?.detail_level ?? category.required_detail_level;
      }

      setEnabled(nextEnabled);
      setLevels(nextLevels);
    },
    []
  );

  const load = useCallback(async () => {
    try {
      const [linksResponse, consentsResponse, accessResponse, invitesResponse] = await Promise.all([
        api.get<{ success: boolean; data: { care_links: CareLink[] } }>(
          '/patient/care-links'
        ),
        api.get<{
          success: boolean;
          data: { consents: Consent[]; catalog: CatalogCategory[] };
        }>('/patient/sharing-consents'),
        api.get<{ success: boolean; data: { entries: AccessEntry[] } }>(
          '/patient/access-log',
          { limit: 10 }
        ),
        api
          .get<{ success: boolean; data: { invites: PendingInvite[] } }>(
            '/patient/invitations/pending'
          )
          .catch(() => ({ success: true, data: { invites: [] } })),
      ]);

      const nextLinks = linksResponse.data.care_links ?? [];
      const nextConsents = consentsResponse.data.consents ?? [];
      const nextCatalog = consentsResponse.data.catalog ?? [];
      const nextInvites = invitesResponse.data?.invites ?? [];

      setLinks(nextLinks);
      setConsents(nextConsents);
      setCatalog(nextCatalog);
      setAccessLog(accessResponse.data.entries ?? []);
      setPendingInvites(nextInvites);

      const currentOrgId =
        selectedOrgId &&
        nextLinks.some((link) => link.organization.id === selectedOrgId)
          ? selectedOrgId
          : nextLinks[0]?.organization.id ?? null;

      setSelectedOrgId(currentOrgId);
      const currentLink =
        nextLinks.find((link) => link.organization.id === currentOrgId) ?? null;
      applyConsentState(currentLink, nextConsents, nextCatalog);
    } catch (error) {
      console.error('Error cargando consentimiento clínico:', error);
      Alert.alert(
        'Error',
        'No se pudieron cargar tus consentimientos. Revisa tu conexión e inténtalo de nuevo.'
      );
    }
  }, [applyConsentState, selectedOrgId]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
    // Solo al montar; las recargas manuales usan refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const acceptInvite = async (inviteId: string) => {
    setAcceptingId(inviteId);
    try {
      await api.post(`/patient/invitations/${inviteId}/accept`);
      Alert.alert('Vínculo creado', 'Ya formas parte del centro. Configura tu consentimiento abajo.');
      await load();
    } catch (error) {
      console.error('Error aceptando invitación:', error);
      Alert.alert('Error', 'No se pudo aceptar la invitación.');
    } finally {
      setAcceptingId(null);
    }
  };

  const selectLink = (link: CareLink) => {
    setSelectedOrgId(link.organization.id);
    applyConsentState(link, consents, catalog);
  };

  const toggleCategory = (key: string) => {
    setEnabled((previous) => {
      const next = { ...previous, [key]: !previous[key] };
      if (next[key]) {
        // Activar dependencias declaradas por la taxonomía.
        const definition = catalog.find((category) => category.key === key);
        for (const dependency of definition?.depends_on ?? []) {
          next[dependency] = true;
        }
      }
      return next;
    });
  };

  const setLevel = (key: string, level: DetailLevel) => {
    setLevels((previous) => ({ ...previous, [key]: level }));
  };

  const saveTreatment = async (): Promise<void> => {
    if (!selectedLink) return;

    const categories = treatmentCatalog.map((category) => ({
      category: category.key,
      detail_level: levels[category.key] ?? category.required_detail_level,
      enabled: Boolean(enabled[category.key]),
    }));

    if (!categories.some((category) => category.enabled)) {
      Alert.alert(
        'Nada seleccionado',
        'Elige al menos una categoría para compartir o revoca el consentimiento.'
      );
      return;
    }

    const granteeType = selectedLink.assigned_professional
      ? 'professional'
      : 'organization';
    const granteeId =
      selectedLink.assigned_professional?.id ?? selectedLink.organization.id;

    if (treatmentConsent) {
      await api.put(`/patient/sharing-consents/${treatmentConsent.id}`, {
        categories,
        history_days: 90,
      });
    } else {
      await api.post('/patient/sharing-consents', {
        organization_id: selectedLink.organization.id,
        grantee_type: granteeType,
        grantee_id: granteeId,
        purpose: 'treatment',
        history_days: 90,
        categories,
      });
    }
  };

  const saveSafety = async (): Promise<void> => {
    if (!selectedLink || !riskCategory) return;

    if (safetyDraft && !safetyConsent) {
      await api.post('/patient/sharing-consents', {
        organization_id: selectedLink.organization.id,
        grantee_type: 'organization',
        grantee_id: selectedLink.organization.id,
        purpose: 'safety',
        history_days: 30,
        categories: [
          {
            category: riskCategory.key,
            detail_level: riskCategory.required_detail_level,
            enabled: true,
          },
        ],
      });
    } else if (!safetyDraft && safetyConsent) {
      await api.delete(`/patient/sharing-consents/${safetyConsent.id}`);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveTreatment();
      await saveSafety();
      await load();
      Alert.alert('Guardado', 'Tus preferencias de consentimiento fueron actualizadas.');
    } catch (error) {
      console.error('Error guardando consentimiento:', error);
      Alert.alert('Error', 'No se pudo guardar el consentimiento. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = () => {
    if (!treatmentConsent) return;
    Alert.alert(
      'Revocar consentimiento',
      'El terapeuta dejará de ver tus datos de inmediato. Esta acción no borra el historial de accesos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Revocar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(
                `/patient/sharing-consents/${treatmentConsent.id}`
              );
              await load();
              Alert.alert('Revocado', 'El acceso fue revocado.');
            } catch (error) {
              console.error('Error revocando consentimiento:', error);
              Alert.alert('Error', 'No se pudo revocar el consentimiento.');
            }
          },
        },
      ]
    );
  };

  const handleExport = async () => {
    try {
      const response = await api.get<{ data: any }>('/patient/data-export');
      const data = response.data;
      const summary =
        `Check-ins: ${data?.clinical?.checkins?.length ?? 0}\n` +
        `Consentimientos: ${data?.consent?.consents?.length ?? 0}\n` +
        `Accesos registrados: ${data?.access_log?.length ?? 0}`;
      Alert.alert('Exportación de tus datos', summary);
    } catch {
      Alert.alert('Error', 'No se pudo exportar tus datos.');
    }
  };

  const handleRequestDeletion = () => {
    Alert.alert(
      'Solicitar borrado de datos',
      'Se enviará una solicitud al centro. El borrado se realiza según la normativa vigente y puede no aplicar a datos con obligación legal de retención.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Solicitar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post('/patient/data-deletion', {
                reason: 'Solicitud desde la app',
              });
              Alert.alert('Solicitud enviada', 'El centro revisará tu solicitud.');
            } catch {
              Alert.alert('Error', 'No se pudo enviar la solicitud.');
            }
          },
        },
      ]
    );
  };

  // El protocolo de seguridad se controla aparte del consentimiento de tratamiento.
  const safetyEnabled = Boolean(
    safetyConsent?.categories.find((category) => category.enabled)
  );
  const [safetyDraft, setSafetyDraft] = useState(safetyEnabled);

  useEffect(() => {
    setSafetyDraft(safetyEnabled);
  }, [safetyEnabled]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.muted, { color: theme.colors.textSecondary }]}>
          Cargando consentimientos…
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Card variant="elevated" padding="md">
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Qué compartes y con quién
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Tú decides categoría por categoría. El centro no puede activar datos por ti y
          puedes revocar el acceso cuando quieras.
        </Text>

        {pendingInvites.length > 0 && (
          <View style={styles.invitesBlock}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Invitaciones pendientes
            </Text>
            {pendingInvites.map((invite) => (
              <View key={invite.id} style={styles.inviteRow}>
                <View style={styles.flex}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    {invite.organization_name}
                  </Text>
                  <Text style={[styles.muted, { color: theme.colors.textSecondary }]}>
                    {invite.professional_name
                      ? `Terapeuta asignado: ${invite.professional_name}`
                      : 'Terapeuta por asignar'}
                  </Text>
                </View>
                <Button
                  variant="primary"
                  size="sm"
                  title={acceptingId === invite.id ? 'Aceptando…' : 'Aceptar'}
                  onPress={() => acceptInvite(invite.id)}
                  loading={acceptingId === invite.id}
                />
              </View>
            ))}
          </View>
        )}

        {links.length === 0 ? (
          <Text style={[styles.muted, { color: theme.colors.textSecondary }]}>
            Todavía no tienes un centro vinculado. Cuando aceptes una invitación,
            aparecerá aquí.
          </Text>
        ) : (
          links.map((link) => {
            const selected = link.organization.id === selectedOrgId;
            return (
              <Pressable
                key={link.organization.id}
                onPress={() => selectLink(link)}
                style={[
                  styles.orgRow,
                  {
                    borderColor: selected ? theme.colors.primary : theme.colors.border,
                    backgroundColor: selected
                      ? theme.colors.surface
                      : 'transparent',
                  },
                ]}
              >
                <View style={styles.flex}>
                  <Text style={[styles.orgName, { color: theme.colors.text }]}>
                    {link.organization.name}
                  </Text>
                  <Text style={[styles.muted, { color: theme.colors.textSecondary }]}>
                    {link.assigned_professional
                      ? `Profesional asignado: ${link.assigned_professional.name}`
                      : 'Sin profesional asignado'}
                  </Text>
                </View>
                <Text style={[styles.orgState, { color: theme.colors.primary }]}>
                  {selected ? 'Seleccionado' : 'Ver'}
                </Text>
              </Pressable>
            );
          })
        )}
      </Card>

      {selectedLink && (
        <>
          <Card variant="elevated" padding="md">
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Datos para tu tratamiento
              </Text>
              {treatmentConsent && (
                <Text style={[styles.muted, { color: theme.colors.textSecondary }]}>
                  Vence: {formatDate(treatmentConsent.expires_at)}
                </Text>
              )}
            </View>

            {treatmentCatalog.map((category) => {
              const active = Boolean(enabled[category.key]);
              const chosenLevel =
                levels[category.key] ?? category.required_detail_level;
              const allowedLevels = DETAIL_OPTIONS.filter(
                (level) =>
                  DETAIL_RANK[level] >= DETAIL_RANK[category.required_detail_level]
              );

              return (
                <View
                  key={category.key}
                  style={[
                    styles.category,
                    { borderBottomColor: theme.colors.border },
                  ]}
                >
                  <View style={styles.categoryHeader}>
                    <View style={styles.flex}>
                      <Text style={[styles.label, { color: theme.colors.text }]}>
                        {category.label}
                      </Text>
                      <Text
                        style={[styles.muted, { color: theme.colors.textSecondary }]}
                      >
                        {category.description}
                      </Text>
                    </View>
                    <Switch
                      value={active}
                      onValueChange={() => toggleCategory(category.key)}
                      trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                    />
                  </View>

                  {active && (
                    <View style={styles.levels}>
                      {allowedLevels.map((level) => {
                        const selected = chosenLevel === level;
                        return (
                          <Pressable
                            key={level}
                            onPress={() => setLevel(category.key, level)}
                            style={[
                              styles.levelChip,
                              {
                                borderColor: selected
                                  ? theme.colors.primary
                                  : theme.colors.border,
                                backgroundColor: selected
                                  ? theme.colors.primary
                                  : 'transparent',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.levelText,
                                {
                                  color: selected
                                    ? theme.colors.background
                                    : theme.colors.textSecondary,
                                },
                              ]}
                            >
                              {DETAIL_LABELS[level]}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}

            {riskCategory && (
              <View style={styles.category}>
                <View style={styles.categoryHeader}>
                  <View style={styles.flex}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      {riskCategory.label}
                    </Text>
                    <Text
                      style={[styles.muted, { color: theme.colors.textSecondary }]}
                    >
                      {riskCategory.description}
                    </Text>
                  </View>
                  <Switch
                    value={safetyDraft}
                    onValueChange={setSafetyDraft}
                    trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  />
                </View>
              </View>
            )}

            <Button
              variant="primary"
              title="Guardar consentimiento"
              onPress={handleSave}
              loading={saving}
              style={styles.saveButton}
            />

            {treatmentConsent && (
              <Button
                variant="secondary"
                title="Revocar todo el acceso"
                onPress={handleRevoke}
                style={styles.revokeButton}
              />
            )}

            <View style={styles.rightsRow}>
              <Button
                variant="outline"
                title="Exportar mis datos"
                onPress={handleExport}
                style={styles.flex}
              />
              <Button
                variant="outline"
                title="Solicitar borrado"
                onPress={handleRequestDeletion}
                style={styles.flex}
              />
            </View>
          </Card>

          <Card variant="elevated" padding="md">
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Quién accedió a tu información
            </Text>
            <Text style={[styles.muted, { color: theme.colors.textSecondary }]}>
              Mostramos los últimos accesos y también los intentos denegados.
            </Text>

            {accessLog.length === 0 ? (
              <Text style={[styles.muted, { color: theme.colors.textSecondary }]}>
                Aún no hay accesos registrados.
              </Text>
            ) : (
              accessLog.map((entry) => (
                <View
                  key={entry.id}
                  style={[styles.logRow, { borderBottomColor: theme.colors.border }]}
                >
                  <View style={styles.flex}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      {entry.actor_name} · {entry.resource_type}
                    </Text>
                    <Text style={[styles.muted, { color: theme.colors.textSecondary }]}>
                      {new Date(entry.created_at).toLocaleString('es-CL')}
                      {entry.organization_name ? ` · ${entry.organization_name}` : ''}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.logState,
                      {
                        color: entry.success
                          ? theme.colors.primary
                          : theme.colors.error ?? '#B00020',
                      },
                    ]}
                  >
                    {entry.success ? 'Permitido' : 'Denegado'}
                  </Text>
                </View>
              ))
            )}
          </Card>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  flex: { flex: 1 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  orgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  orgName: { fontSize: 15, fontWeight: '600' },
  orgState: { fontSize: 13, fontWeight: '600' },
  category: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  label: { fontSize: 15, fontWeight: '600' },
  muted: { fontSize: 13, lineHeight: 18, marginTop: 2 },
  levels: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  levelChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  levelText: { fontSize: 12, fontWeight: '600' },
  saveButton: { marginTop: 16 },
  revokeButton: { marginTop: 10 },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  logState: { fontSize: 12, fontWeight: '700' },
  invitesBlock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
    marginTop: 4,
    gap: 8,
  },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  rightsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
});

export default ClinicalDataConsentScreen;
