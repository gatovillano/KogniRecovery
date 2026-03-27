/**
 * MedicationScreen - Módulo de registro de medicamentos diarios
 * KogniRecovery
 *
 * Permite a los usuarios:
 * - Registrar medicamentos con nombre, dosis y horario
 * - Marcar medicamentos como tomados por día
 * - Ver el estado diario de todos sus medicamentos
 * - Editar/eliminar medicamentos
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme/ThemeContext';
import { api } from '@services/api';
import { MEDICATION_ENDPOINTS } from '@services/endpoints';
import { ApiResponse } from '../../types/api';
import Icon from '@expo/vector-icons/Ionicons';
import { Header } from '@components';
import {
  scheduleMedicationNotification,
  cancelMedicationNotification,
  rescheduleAllMedications,
  requestNotificationPermission,
  configureNotificationHandler,
} from '@services/notificationService';

// ─── Interfaces ────────────────────────────────────────────────────────────────

interface Medication {
  id: string;
  name: string;
  dosage: string;
  schedule_time: string;
  is_active: boolean;
  is_taken?: boolean; // Del estado diario
}

interface MedicationFormData {
  name: string;
  dosage: string;
  schedule_time: string;
}

// ─── Utilidades ────────────────────────────────────────────────────────────────

const getLocalDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTime = (timeStr: string): string => {
  // timeStr puede venir como "09:00:00" o "09:00"
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parts[1] || '00';
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHour}:${minutes} ${period}`;
};

const getProgressPercent = (medications: Medication[]): number => {
  if (medications.length === 0) return 0;
  const taken = medications.filter((m) => m.is_taken).length;
  return Math.round((taken / medications.length) * 100);
};

// ─── Componentes internos ──────────────────────────────────────────────────────

interface MedicationCardProps {
  medication: Medication;
  onToggle: (id: string) => void;
  onEdit: (medication: Medication) => void;
  onDelete: (id: string) => void;
  theme: any;
  toggling: boolean;
}

const MedicationCard: React.FC<MedicationCardProps> = ({
  medication,
  onToggle,
  onEdit,
  onDelete,
  theme,
  toggling,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleToggle = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    onToggle(medication.id);
  };

  const isTaken = !!medication.is_taken;

  return (
    <Animated.View
      style={[
        styles.medicationCard,
        {
          backgroundColor: theme.colors.card,
          borderColor: isTaken ? theme.colors.success + '40' : theme.colors.border,
          borderWidth: isTaken ? 1.5 : 1,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Indicador lateral de estado */}
      <View
        style={[
          styles.statusBar,
          {
            backgroundColor: isTaken ? theme.colors.success : theme.colors.border,
          },
        ]}
      />

      <View style={styles.cardBody}>
        {/* Info del medicamento */}
        <View style={styles.cardInfo}>
          <View style={styles.cardNameRow}>
            <Icon
              name="medical-outline"
              size={18}
              color={isTaken ? theme.colors.success : theme.colors.primary}
            />
            <Text style={[styles.medicationName, { color: theme.colors.text }]} numberOfLines={1}>
              {medication.name}
            </Text>
          </View>

          <View style={styles.cardMeta}>
            <View style={[styles.dosageBadge, { backgroundColor: theme.colors.primary + '15' }]}>
              <Icon name="flask-outline" size={13} color={theme.colors.primary} />
              <Text style={[styles.dosageText, { color: theme.colors.primary }]}>
                {medication.dosage}
              </Text>
            </View>

            <View
              style={[
                styles.timeBadge,
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
              ]}
            >
              <Icon name="time-outline" size={13} color={theme.colors.textSecondary} />
              <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>
                {formatTime(medication.schedule_time)}
              </Text>
            </View>
          </View>

          {isTaken && (
            <View style={styles.takenBadge}>
              <Icon name="checkmark-circle" size={13} color={theme.colors.success} />
              <Text style={[styles.takenText, { color: theme.colors.success }]}>Tomado hoy</Text>
            </View>
          )}
        </View>

        {/* Acciones */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              {
                backgroundColor: isTaken ? theme.colors.success : theme.colors.primary,
                opacity: toggling ? 0.6 : 1,
              },
            ]}
            onPress={handleToggle}
            disabled={toggling}
          >
            {toggling ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Icon name={isTaken ? 'close-outline' : 'checkmark-outline'} size={22} color="#fff" />
            )}
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: theme.colors.surface }]}
              onPress={() => onEdit(medication)}
            >
              <Icon name="pencil-outline" size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: theme.colors.error + '15' }]}
              onPress={() => onDelete(medication.id)}
            >
              <Icon name="trash-outline" size={16} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

// ─── Componente principal ──────────────────────────────────────────────────────

export const MedicationScreen: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  // Estado principal
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [today] = useState(getLocalDateString());

  // Modal de creación/edición
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MedicationFormData>({
    name: '',
    dosage: '',
    schedule_time: '08:00',
  });

  // Animación de entrada
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Configurar el handler de notificaciones y pedir permiso
    configureNotificationHandler();
    requestNotificationPermission();
    fetchDailyStatus();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Peticiones de Red ──────────────────────────────────────────────────────

  const fetchDailyStatus = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<ApiResponse<Medication[]>>(
        `${MEDICATION_ENDPOINTS.DAILY_STATUS}?date=${today}`
      );
      if (response?.success) {
        const meds = response.data || [];
        setMedications(meds);
        // Reprogramar notificaciones con la lista actualizada
        rescheduleAllMedications(meds).catch((e) =>
          console.warn('[Notif] No se pudo reprogramar:', e)
        );
      }
    } catch (error) {
      console.error('Error fetching medications:', error);
      Alert.alert('Error', 'No se pudieron cargar los medicamentos.');
    } finally {
      setLoading(false);
    }
  }, [today]);

  const handleToggleTaken = async (id: string) => {
    setTogglingId(id);
    try {
      const response = await api.post<ApiResponse<{ taken: boolean }>>(
        MEDICATION_ENDPOINTS.TOGGLE_TAKEN(id),
        { date: today }
      );
      if (response?.success) {
        setMedications((prev) =>
          prev.map((m) => (m.id === id ? { ...m, is_taken: response.data.taken } : m))
        );
      }
    } catch (error) {
      console.error('Error toggling medication:', error);
      Alert.alert('Error', 'No se pudo registrar la toma.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleSaveMedication = async () => {
    if (!form.name.trim() || !form.dosage.trim() || !form.schedule_time.trim()) {
      Alert.alert('Campos requeridos', 'Por favor completa todos los campos.');
      return;
    }

    // Validar formato HH:MM
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(form.schedule_time)) {
      Alert.alert('Horario inválido', 'El horario debe estar en formato HH:MM (ej: 08:30)');
      return;
    }

    setSaving(true);
    try {
      let response: ApiResponse<Medication>;
      if (isEditing && editingId) {
        response = await api.put<ApiResponse<Medication>>(
          MEDICATION_ENDPOINTS.UPDATE(editingId),
          form
        );
      } else {
        response = await api.post<ApiResponse<Medication>>(MEDICATION_ENDPOINTS.CREATE, form);
      }
      if (response?.success) {
        // Programar / reprogramar notificación diaria
        scheduleMedicationNotification(response.data).then((id) => {
          if (id) {
            console.log(`[Notif] Notificación programada: ${id}`);
          } else {
            console.warn('[Notif] No se pudo programar la notificación (¿sin permiso?)');
          }
        });
        closeModal();
        fetchDailyStatus();
      }
    } catch (error) {
      console.error('Error saving medication:', error);
      Alert.alert('Error', 'No se pudo guardar el medicamento.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMedication = (id: string) => {
    Alert.alert(
      'Eliminar medicamento',
      '¿Estás seguro? Se eliminará el medicamento y todo su historial de tomas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.delete<ApiResponse<any>>(MEDICATION_ENDPOINTS.DELETE(id));
              if (response?.success) {
                // Cancelar notificación asociada
                cancelMedicationNotification(id);
                setMedications((prev) => prev.filter((m) => m.id !== id));
              }
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el medicamento.');
            }
          },
        },
      ]
    );
  };

  // ── Modal helpers ──────────────────────────────────────────────────────────

  const openCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setForm({ name: '', dosage: '', schedule_time: '08:00' });
    setShowModal(true);
  };

  const openEditModal = (medication: Medication) => {
    setIsEditing(true);
    setEditingId(medication.id);
    setForm({
      name: medication.name,
      dosage: medication.dosage,
      schedule_time: medication.schedule_time.substring(0, 5), // "09:00:00" → "09:00"
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setIsEditing(false);
  };

  // ── Cálculos de progreso ───────────────────────────────────────────────────

  const takenCount = medications.filter((m) => m.is_taken).length;
  const totalCount = medications.length;
  const progressPercent = getProgressPercent(medications);
  const allTaken = totalCount > 0 && takenCount === totalCount;

  const todayFormatted = new Date().toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  // ── Render ─────────────────────────────────────────────────────────────────

  const renderProgressHeader = () => (
    <View
      style={[
        styles.progressCard,
        { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
      ]}
    >
      <View style={styles.progressHeader}>
        <View>
          <Text style={[styles.progressTitle, { color: theme.colors.text }]}>
            Medicamentos de hoy
          </Text>
          <Text style={[styles.progressDate, { color: theme.colors.textSecondary }]}>
            {todayFormatted}
          </Text>
        </View>

        <View
          style={[
            styles.progressCircle,
            {
              backgroundColor: allTaken ? theme.colors.success + '20' : theme.colors.primary + '15',
              borderColor: allTaken ? theme.colors.success : theme.colors.primary,
            },
          ]}
        >
          <Text
            style={[
              styles.progressPercent,
              {
                color: allTaken ? theme.colors.success : theme.colors.primary,
              },
            ]}
          >
            {progressPercent}%
          </Text>
        </View>
      </View>

      {/* Barra de progreso */}
      <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              backgroundColor: allTaken ? theme.colors.success : theme.colors.primary,
              width: `${progressPercent}%` as any,
            },
          ]}
        />
      </View>

      <Text style={[styles.progressLabel, { color: theme.colors.textSecondary }]}>
        {totalCount === 0
          ? 'Agrega tu primer medicamento'
          : allTaken
            ? '✅ ¡Completaste todos tus medicamentos!'
            : `${takenCount} de ${totalCount} tomados`}
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.colors.primary + '15' }]}>
        <Icon name="medical-outline" size={48} color={theme.colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        Sin medicamentos registrados
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        Agrega tus medicamentos para hacer un seguimiento diario de tus tomas
      </Text>
      <TouchableOpacity
        style={[styles.emptyButton, { backgroundColor: theme.colors.primary }]}
        onPress={openCreateModal}
      >
        <Icon name="add-outline" size={20} color="#fff" />
        <Text style={styles.emptyButtonText}>Agregar medicamento</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMedicationModal = () => (
    <Modal visible={showModal} transparent animationType="slide" onRequestClose={closeModal}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.card }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {isEditing ? 'Editar medicamento' : 'Nuevo medicamento'}
            </Text>
            <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
              <Icon name="close" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Campo: Nombre */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
                Nombre del medicamento *
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Icon name="medical-outline" size={18} color={theme.colors.primary} />
                <TextInput
                  style={[styles.textInput, { color: theme.colors.text }]}
                  placeholder="Ej: Sertralina, Clonazepam..."
                  placeholderTextColor={theme.colors.textSecondary + '80'}
                  value={form.name}
                  onChangeText={(txt) => setForm((f) => ({ ...f, name: txt }))}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Campo: Dosis */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
                Dosis y presentación *
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Icon name="flask-outline" size={18} color={theme.colors.primary} />
                <TextInput
                  style={[styles.textInput, { color: theme.colors.text }]}
                  placeholder="Ej: 50mg, 1 comprimido, 5ml..."
                  placeholderTextColor={theme.colors.textSecondary + '80'}
                  value={form.dosage}
                  onChangeText={(txt) => setForm((f) => ({ ...f, dosage: txt }))}
                />
              </View>
            </View>

            {/* Campo: Horario */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
                Horario de toma *
              </Text>
              <Text style={[styles.fieldHint, { color: theme.colors.textSecondary }]}>
                Formato 24 horas: HH:MM (ej: 08:30, 14:00, 22:00)
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Icon name="time-outline" size={18} color={theme.colors.primary} />
                <TextInput
                  style={[styles.textInput, { color: theme.colors.text }]}
                  placeholder="08:00"
                  placeholderTextColor={theme.colors.textSecondary + '80'}
                  value={form.schedule_time}
                  onChangeText={(txt) => setForm((f) => ({ ...f, schedule_time: txt }))}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </View>

              {/* Horarios rápidos */}
              <Text
                style={[styles.fieldLabel, { color: theme.colors.textSecondary, marginTop: 12 }]}
              >
                Horarios comunes
              </Text>
              <View style={styles.quickTimes}>
                {['06:00', '08:00', '10:00', '12:00', '14:00', '18:00', '20:00', '22:00'].map(
                  (time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.quickTimeBtn,
                        {
                          backgroundColor:
                            form.schedule_time === time
                              ? theme.colors.primary
                              : theme.colors.surface,
                          borderColor:
                            form.schedule_time === time
                              ? theme.colors.primary
                              : theme.colors.border,
                        },
                      ]}
                      onPress={() => setForm((f) => ({ ...f, schedule_time: time }))}
                    >
                      <Text
                        style={[
                          styles.quickTimeText,
                          {
                            color: form.schedule_time === time ? '#fff' : theme.colors.text,
                          },
                        ]}
                      >
                        {time}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </View>
          </ScrollView>

          {/* Botones footer */}
          <View style={[styles.modalFooter, { borderTopColor: theme.colors.border }]}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: theme.colors.border }]}
              onPress={closeModal}
            >
              <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>
                Cancelar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveButton,
                {
                  backgroundColor: theme.colors.primary,
                  opacity: saving ? 0.7 : 1,
                },
              ]}
              onPress={handleSaveMedication}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon name="save-outline" size={18} color="#fff" />
                  <Text style={styles.saveButtonText}>
                    {isEditing ? 'Guardar cambios' : 'Agregar'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <Header
        title="Medicamentos"
        subtitle="Registro de tomas diarias"
        icon="medkit-outline"
        actionIcon="add"
        onAction={openCreateModal}
      />

      {/* Contenido */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Cargando medicamentos...
          </Text>
        </View>
      ) : (
        <Animated.ScrollView
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: insets.bottom + 24,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Tarjeta de progreso */}
          {renderProgressHeader()}

          {/* Lista de medicamentos */}
          {medications.length === 0 ? (
            renderEmptyState()
          ) : (
            <View style={styles.medicationList}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  Lista de medicamentos
                </Text>
                <TouchableOpacity onPress={fetchDailyStatus}>
                  <Icon name="refresh-outline" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>

              {medications.map((medication) => (
                <MedicationCard
                  key={medication.id}
                  medication={medication}
                  onToggle={handleToggleTaken}
                  onEdit={openEditModal}
                  onDelete={handleDeleteMedication}
                  theme={theme}
                  toggling={togglingId === medication.id}
                />
              ))}

              {/* Botón agregar al final */}
              <TouchableOpacity
                style={[
                  styles.addMoreBtn,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={openCreateModal}
              >
                <Icon name="add-circle-outline" size={20} color={theme.colors.primary} />
                <Text style={[styles.addMoreText, { color: theme.colors.primary }]}>
                  Agregar otro medicamento
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Info footer */}
          <View
            style={[
              styles.infoBox,
              {
                backgroundColor: theme.colors.primary + '10',
                borderColor: theme.colors.primary + '30',
              },
            ]}
          >
            <Icon name="information-circle-outline" size={20} color={theme.colors.primary} />
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              El registro se reinicia cada día. Marca cada medicamento al tomarlo para mantener un
              seguimiento preciso.
            </Text>
          </View>
        </Animated.ScrollView>
      )}

      {/* Modal */}
      {renderMedicationModal()}
    </View>
  );
};

// ─── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },

  // Scroll
  scrollContent: {
    padding: 20,
    gap: 20,
  },

  // Progress card
  progressCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    elevation: 2,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  progressDate: {
    fontSize: 13,
    marginTop: 3,
    textTransform: 'capitalize',
  },
  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: '800',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 13,
    textAlign: 'center',
  },

  // Medication list
  medicationList: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },

  // Medication card
  medicationCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
    elevation: 2,
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  statusBar: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  cardInfo: {
    flex: 1,
    gap: 6,
  },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  medicationName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    letterSpacing: -0.2,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  dosageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dosageText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  timeText: {
    fontSize: 12,
  },
  takenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  takenText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Card actions
  cardActions: {
    alignItems: 'center',
    gap: 8,
  },
  toggleBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 6,
  },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 16,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
    elevation: 3,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  // Add more button
  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    paddingVertical: 14,
    marginTop: 4,
  },
  addMoreText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Info box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    borderTopWidth: 1,
  },

  // Form fields
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldHint: {
    fontSize: 12,
    marginBottom: 8,
    marginTop: -4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    height: 52,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },

  // Quick time buttons
  quickTimes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickTimeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  quickTimeText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Modal buttons
  cancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 3,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default MedicationScreen;
