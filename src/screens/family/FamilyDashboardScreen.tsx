/**
 * FamilyDashboardScreen - Dashboard del familiar
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, RefreshControl, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '@theme/ThemeContext';
import { Card, Button } from '@components';
import { api } from '@services/api';

interface Patient {
  id: string;
  name: string;
  email: string;
  risk_level?: string;
  profile_type?: string;
  last_checkin?: {
    mood_score: number;
    anxiety_score: number;
    energy_score: number;
    checkin_date: string;
    emotional_tags: string[];
  };
  streaks?: Array<{
    streak_type: string;
    current_streak: number;
    longest_streak: number;
  }>;
  active_cravings: number;
}

export const FamilyDashboardScreen: React.FC = () => {
  const { theme } = useTheme();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);

  const loadPatients = useCallback(async () => {
    try {
      const response = await api.get<any>('/family/dashboard');
      if (response && response.data && (response.data as any).success) {
        setPatients((response.data as any).data.patients || []);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSendMessage = async () => {
    if (!selectedPatient || !messageText.trim()) return;

    setSending(true);
    try {
      const response = await api.post(`/family/patients/${selectedPatient.id}/message`, {
        message: messageText.trim()
      });
      
      if (response && (response as any).success) {
        Alert.alert('Éxito', 'Mensaje enviado correctamente');
        setMessageModalVisible(false);
        setMessageText('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'No se pudo enviar el mensaje');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPatients();
    setRefreshing(false);
  };

  const getRiskColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'alto':
      case 'critico':
        return theme.colors.error;
      case 'medio':
        return theme.colors.warning;
      default:
        return theme.colors.success;
    }
  };

  const renderPatientCard = ({ item }: { item: Patient }) => (
    <Card variant="elevated" padding="md" style={styles.patientCard}>
      <View style={styles.patientHeader}>
        <View style={styles.patientInfo}>
          <Text style={[styles.patientName, { color: theme.colors.text }]}>
            {item.name}
          </Text>
          <View style={[styles.riskBadge, { backgroundColor: getRiskColor(item.risk_level) + '20' }]}>
            <Text style={[styles.riskText, { color: getRiskColor(item.risk_level) }]}>
              {item.risk_level || 'bajo'} riesgo
            </Text>
          </View>
        </View>
      </View>

      {/* Último Check-in */}
      {item.last_checkin && (
        <View style={[styles.checkinInfo, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
            Último check-in
          </Text>
          <View style={styles.checkinStats}>
            <View style={styles.checkinStat}>
              <Text style={[styles.checkinValue, { color: theme.colors.primary }]}>
                {item.last_checkin.mood_score || '-'}
              </Text>
              <Text style={[styles.checkinLabel, { color: theme.colors.textSecondary }]}>Ánimo</Text>
            </View>
            <View style={styles.checkinStat}>
              <Text style={[styles.checkinValue, { color: theme.colors.warning }]}>
                {item.last_checkin.anxiety_score || '-'}
              </Text>
              <Text style={[styles.checkinLabel, { color: theme.colors.textSecondary }]}>Ansiedad</Text>
            </View>
            <View style={styles.checkinStat}>
              <Text style={[styles.checkinValue, { color: theme.colors.secondary }]}>
                {item.last_checkin.energy_score || '-'}
              </Text>
              <Text style={[styles.checkinLabel, { color: theme.colors.textSecondary }]}>Energía</Text>
            </View>
          </View>
        </View>
      )}

      {/* Rachas */}
      {item.streaks && item.streaks.length > 0 && (
        <View style={styles.streaksRow}>
          <View style={styles.streakItem}>
            <Text style={[styles.streakValue, { color: theme.colors.primary }]}>
              {item.streaks.find(s => s.streak_type === 'checkin_completed')?.current_streak || 0}
            </Text>
            <Text style={[styles.streakLabel, { color: theme.colors.textSecondary }]}>
              Días seguidos
            </Text>
          </View>
        </View>
      )}

      {/* Cravings activos */}
      {item.active_cravings > 0 && (
        <View style={[styles.cravingAlert, { backgroundColor: theme.colors.warning + '15' }]}>
          <Text style={[styles.cravingText, { color: theme.colors.warning }]}>
            ⚠️ {item.active_cravings} craving(s) activo(s)
          </Text>
        </View>
      )}

      {/* Acciones */}
      <View style={styles.actions}>
        <Button
          variant="primary"
          size="sm"
          title="💬 Enviar mensaje"
          onPress={() => {
            setSelectedPatient(item);
            setMessageModalVisible(true);
          }}
        />
        <Button
          variant="secondary"
          size="sm"
          title="📊 Ver progreso"
          onPress={() => {}}
        />
      </View>
    </Card>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Cargando...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          👨‍👩‍👧 Dashboard Familiar
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Seguimiento de tus seres queridos
        </Text>
      </View>

      {/* Resumen */}
      <Card variant="elevated" padding="md" style={styles.summaryCard}>
        <Text style={[styles.summaryTitle, { color: theme.colors.text }]}>
          Resumen
        </Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>
              {patients.length}
            </Text>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
              Pacientes
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: theme.colors.success }]}>
              {patients.filter(p => p.risk_level === 'bajo').length}
            </Text>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
              Riesgo bajo
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: theme.colors.warning }]}>
              {patients.filter(p => p.active_cravings > 0).length}
            </Text>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
              Con cravings
            </Text>
          </View>
        </View>
      </Card>

      {/* Lista de pacientes */}
      {patients.length > 0 ? (
        <FlatList
          data={patients}
          renderItem={renderPatientCard}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <Card variant="outlined" padding="md" style={styles.emptyCard}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            No tienes pacientes asociados aún.
          </Text>
          <Text style={[styles.emptyHint, { color: theme.colors.textSecondary }]}>
            Los pacientes deben compartir su progreso contigo desde la app.
          </Text>
        </Card>
      )}

      {/* Botón de ayuda */}
      <Card variant="outlined" padding="md" style={styles.helpCard}>
        <Text style={[styles.helpTitle, { color: theme.colors.text }]}>
          💚 ¿Necesitas apoyo?
        </Text>
        <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>
          Si tu ser querido está pasando por un momento difícil, recuerda que puedes:
        </Text>
        <Text style={[styles.helpBullet, { color: theme.colors.textSecondary }]}>
          • Ofrecer apoyo sin juzgar{'\n'}
          • Escuchar activamente{'\n'}
          • Invitarlo a hablar con NADA{'\n'}
          • Contactar a profesionales si es necesario
        </Text>
      </Card>

      {/* Modal para enviar mensaje */}
      <Modal
        visible={messageModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setMessageModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setMessageModalVisible(false)}
        >
          <View 
            style={[
              styles.modalContent, 
              { backgroundColor: theme.colors.background }
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Enviar mensaje a {selectedPatient?.name}
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
              Tu mensaje aparecerá en su pared compartida.
            </Text>
            
            <TextInput
              style={[
                styles.messageInput, 
                { 
                  color: theme.colors.text, 
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border
                }
              ]}
              placeholder="Escribe algo alentador..."
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              value={messageText}
              onChangeText={setMessageText}
              autoFocus
            />
            
            <View style={styles.modalActions}>
              <Button
                variant="outline"
                title="Cancelar"
                onPress={() => setMessageModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                variant="primary"
                title={sending ? "Enviando..." : "Enviar"}
                onPress={handleSendMessage}
                disabled={sending || !messageText.trim()}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  summaryCard: {},
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  listContent: {
    gap: 12,
  },
  patientCard: {
    marginBottom: 0,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  riskBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  riskText: {
    fontSize: 12,
    fontWeight: '500',
  },
  checkinInfo: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  checkinStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  checkinStat: {
    alignItems: 'center',
  },
  checkinValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  checkinLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  streaksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  streakItem: {
    alignItems: 'center',
  },
  streakValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  streakLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  cravingAlert: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  cravingText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    textAlign: 'center',
  },
  helpCard: {},
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    marginBottom: 8,
  },
  helpBullet: {
    fontSize: 14,
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: 300,
    gap: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  messageInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    height: 120,
    textAlignVertical: 'top',
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
});

export default FamilyDashboardScreen;
