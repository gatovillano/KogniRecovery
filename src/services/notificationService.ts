/**
 * Servicio de Notificaciones Locales - KogniRecovery
 *
 * Gestiona notificaciones diarias de recordatorio de medicamentos.
 * Usa expo-notifications para programar alarmas locales sin servidor.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  schedule_time: string; // "HH:MM" o "HH:MM:SS"
}

// ─── Clave de persistencia ────────────────────────────────────────────────────

const STORAGE_KEY = '@kogni:medication_notifications';

/** Mapa { medicationId → notificationIdentifier } almacenado en AsyncStorage */
type NotifMap = Record<string, string>;

// ─── Configuración global de notificaciones ───────────────────────────────────

/**
 * Configura cómo se muestra la notificación cuando la app está en primer plano.
 * Debe llamarse UNA VEZ al inicio de la app (App.tsx o _layout.tsx).
 */
export const configureNotificationHandler = (): void => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
};

// ─── Permisos ─────────────────────────────────────────────────────────────────

/**
 * Solicita permiso para enviar notificaciones.
 * @returns true si el permiso fue concedido
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!Device.isDevice) {
    // En simulador/emulador, no se pueden obtener permisos reales
    console.warn('[Notif] No es un dispositivo físico — notificaciones limitadas');
    return false;
  }

  // Android 13+ requiere permiso explícito POST_NOTIFICATIONS
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  // iOS
  if (Platform.OS === 'ios') {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    return status === 'granted';
  }

  // Android < 13 — permisos automáticos
  return true;
};

// ─── Persistencia del mapa notifId ↔ medicationId ────────────────────────────

const loadNotifMap = async (): Promise<NotifMap> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveNotifMap = async (map: NotifMap): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.error('[Notif] Error guardando mapa de notificaciones:', e);
  }
};

// ─── Programar / Cancelar ─────────────────────────────────────────────────────

/**
 * Parsea "HH:MM" o "HH:MM:SS" → { hour, minute }
 */
const parseTime = (timeStr: string): { hour: number; minute: number } => {
  const parts = timeStr.split(':');
  return {
    hour: parseInt(parts[0], 10),
    minute: parseInt(parts[1] || '0', 10),
  };
};

/**
 * Programa una notificación diaria recurrente para un medicamento.
 * Cancela cualquier notificación previa del mismo med. si existía.
 *
 * @returns el identifier de la notificación programada, o null si falló
 */
export const scheduleMedicationNotification = async (
  medication: Medication
): Promise<string | null> => {
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.warn('[Notif] Sin permisos para notificaciones');
      return null;
    }

    // Cancelar notificación previa de este medicamento si existe
    await cancelMedicationNotification(medication.id);

    const { hour, minute } = parseTime(medication.schedule_time);

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💊 Hora de tu medicamento',
        body: `${medication.name} — ${medication.dosage}`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: {
          type: 'medication_reminder',
          medicationId: medication.id,
          screen: 'Medications',
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    // Persistir la asociación
    const map = await loadNotifMap();
    map[medication.id] = identifier;
    await saveNotifMap(map);

    console.log(
      `[Notif] ✅ Programado "${medication.name}" diario a las ${hour}:${String(minute).padStart(2, '0')} → id: ${identifier}`
    );
    return identifier;
  } catch (error) {
    console.error('[Notif] Error programando notificación:', error);
    return null;
  }
};

/**
 * Cancela la notificación asociada a un medicamento.
 */
export const cancelMedicationNotification = async (
  medicationId: string
): Promise<void> => {
  try {
    const map = await loadNotifMap();
    const identifier = map[medicationId];

    if (identifier) {
      await Notifications.cancelScheduledNotificationAsync(identifier);
      delete map[medicationId];
      await saveNotifMap(map);
      console.log(`[Notif] ❌ Cancelada notificación para medicamentoid=${medicationId}`);
    }
  } catch (error) {
    console.error('[Notif] Error cancelando notificación:', error);
  }
};

/**
 * Reprograma todas las notificaciones activas.
 * Útil al iniciar la app para restaurar notificaciones perdidas
 * (ej: tras reiniciar el dispositivo).
 *
 * @param medications lista completa de medicamentos activos del usuario
 */
export const rescheduleAllMedications = async (
  medications: Medication[]
): Promise<void> => {
  try {
    // Cancelar TODAS las notificaciones pendientes antes de reprogramar
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Limpiar mapa
    await saveNotifMap({});

    // Reprogramar todas
    for (const med of medications) {
      await scheduleMedicationNotification(med);
    }

    console.log(`[Notif] 🔄 Reprogramadas ${medications.length} notificaciones`);
  } catch (error) {
    console.error('[Notif] Error reprogramando notificaciones:', error);
  }
};

/**
 * Devuelve todas las notificaciones de medicamentos actualmente programadas.
 */
export const getScheduledMedicationNotifications =
  async (): Promise<Notifications.NotificationRequest[]> => {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    return all.filter(
      n => n.content.data?.type === 'medication_reminder'
    );
  };

/**
 * Cancela TODAS las notificaciones de medicamentos.
 */
export const cancelAllMedicationNotifications = async (): Promise<void> => {
  const scheduled = await getScheduledMedicationNotifications();
  for (const notif of scheduled) {
    await Notifications.cancelScheduledNotificationAsync(notif.identifier);
  }
  await saveNotifMap({});
  console.log('[Notif] 🗑️ Todas las notificaciones de medicamentos canceladas');
};
