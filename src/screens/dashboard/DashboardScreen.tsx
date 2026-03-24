import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@theme/ThemeContext';
import { Card, Button } from '@components';
import { useCheckIn } from '@hooks/useCheckIn';
import { api } from '@services/api';
import { MainTabNavigationProp } from '@navigation/types';
import { DashboardData, ApiResponse } from '../../types/api';
import Icon from '@expo/vector-icons/Ionicons';

export const DashboardScreen: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MainTabNavigationProp>();
  const { todayCheckIn, checkIns, stats, streaks, hasCheckedInToday, getCurrentStreak, loadTodayCheckIn, loadCheckIns, loadStats, loadStreaks } = useCheckIn();
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  // Cargar datos del dashboard
  const loadDashboardData = async () => {
    try {
      const response = await api.get<ApiResponse<DashboardData>>('/dashboard');
      if (response && response.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  // Usar useFocusEffect para recargar al volver a la pestaña
  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
      loadTodayCheckIn();
      loadCheckIns(1, 10);
      loadStats(30);
      loadStreaks();
    }, [loadTodayCheckIn, loadCheckIns, loadStats, loadStreaks])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadDashboardData(), loadTodayCheckIn(), loadCheckIns(1, 10), loadStats(30), loadStreaks()]);
    setRefreshing(false);
  };

  const currentStreak = getCurrentStreak();
  const longestStreak = streaks.find(s => s.streak_type === 'checkin_completed')?.longest_streak || 0;
  
  const latestCheckIn = todayCheckIn || (checkIns?.length > 0 ? checkIns[0] : null);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[theme.colors.primary + '15', theme.colors.background]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        style={{ flex: 1, paddingTop: insets.top }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        {/* Header de Bienvenida */}
        <View style={styles.header}>
          <Text style={[styles.welcomeSub, { color: theme.colors.textSecondary }]}>
            {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            ¿Cómo te sientes hoy?
          </Text>
        </View>

        {/* Fila de Tarjetas de Acción (SOS y Alertas) */}
        <View style={styles.actionCardsRow}>
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: theme.colors.error + '10', borderColor: theme.colors.error + '30', borderWidth: 1 }]}
            onPress={() => { /* Acción de SOS */ }}
            activeOpacity={0.8}
          >
            <View style={[styles.iconCircle, { backgroundColor: theme.colors.error + '20' }]}>
              <Icon name="megaphone" size={20} color={theme.colors.error} />
            </View>
            <Text style={[styles.actionCardText, { color: theme.colors.error }]}>PEDIR AYUDA (SOS)</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: theme.colors.card, ...theme.shadows.sm }]}
            onPress={() => { /* Navegar a notificaciones */ }}
            activeOpacity={0.8}
          >
            <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '10' }]}>
              <Icon name="notifications" size={20} color={theme.colors.primary} />
              {dashboardData?.unread_notifications_count ? (
                <View style={[styles.badgeContainer, { backgroundColor: theme.colors.error }]}>
                  <Text style={styles.badgeTextSmall}>
                    {dashboardData.unread_notifications_count}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.actionCardText, { color: theme.colors.text }]}>ALERTAS</Text>
          </TouchableOpacity>
        </View>

        {/* Widget de Estado Emocional */}
        <Card variant="elevated" padding="md">
          <View style={styles.widgetHeader}>
            <View>
              <Text style={[styles.widgetTitle, { color: theme.colors.text }]}>Estado Emocional</Text>
              <Text style={[styles.widgetSub, { color: theme.colors.textSecondary }]}>
                {latestCheckIn && latestCheckIn !== todayCheckIn ? 'Último registro' : 'Tu estado de hoy'}
              </Text>
            </View>
            {latestCheckIn?.mood_score && (
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.moodBadge}
              >
                <Text style={styles.moodScore}>
                  {latestCheckIn.mood_score}/10
                </Text>
              </LinearGradient>
            )}
          </View>
          
          {latestCheckIn ? (
            <View>
              <View style={styles.moodRow}>
                <View style={styles.moodItem}>
                  <Text style={[styles.moodLabel, { color: theme.colors.textSecondary }]}>Ánimo</Text>
                  <Text style={[styles.moodValue, { color: theme.colors.text }]}>
                    {latestCheckIn.mood_score || '-'}
                  </Text>
                </View>
                <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                <View style={styles.moodItem}>
                  <Text style={[styles.moodLabel, { color: theme.colors.textSecondary }]}>Ansiedad</Text>
                  <Text style={[styles.moodValue, { color: theme.colors.text }]}>
                    {latestCheckIn.anxiety_score || '-'}
                  </Text>
                </View>
                <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                <View style={styles.moodItem}>
                  <Text style={[styles.moodLabel, { color: theme.colors.textSecondary }]}>Energía</Text>
                  <Text style={[styles.moodValue, { color: theme.colors.text }]}>
                    {latestCheckIn.energy_score || '-'}
                  </Text>
                </View>
              </View>
              {latestCheckIn.emotional_tags && latestCheckIn.emotional_tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {latestCheckIn.emotional_tags.map((tag, index) => (
                    <View key={index} style={[styles.tag, { backgroundColor: theme.colors.primary + '10' }]}>
                      <Text style={[styles.tagText, { color: theme.colors.primary }]}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Icon name="happy-outline" size={40} color={theme.colors.textSecondary + '40'} />
              <Text style={[styles.noData, { color: theme.colors.textSecondary }]}>
                Aún no tienes registros emocionales. ¡Haz tu primer check-in!
              </Text>
            </View>
          )}
        </Card>

        {/* Widget de Rachas y Check-in */}
        <View style={styles.statsRow}>
          <Card style={StyleSheet.flatten([styles.halfWidget, { flex: 1.2 }])} padding="md">
            <Text style={[styles.widgetSub, { color: theme.colors.textSecondary, marginBottom: 8 }]}>Racha actual</Text>
            <View style={styles.streakContainer}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {currentStreak}
              </Text>
              <Icon name="flame" size={24} color={theme.colors.accent} />
            </View>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>días seguidos</Text>
          </Card>

          <Card style={StyleSheet.flatten([styles.halfWidget, { flex: 1 }])} padding="md">
            <Text style={[styles.widgetSub, { color: theme.colors.textSecondary, marginBottom: 8 }]}>Check-in hoy</Text>
            {hasCheckedInToday() ? (
              <View style={styles.checkinStatusBox}>
                <View style={[styles.statusIcon, { backgroundColor: theme.colors.success + '20' }]}>
                  <Icon name="checkmark" size={20} color={theme.colors.success} />
                </View>
                <Text style={[styles.checkinStatus, { color: theme.colors.success }]}>Listo</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.checkinStatusBox} onPress={() => navigation.navigate('CheckIn')}>
                <View style={[styles.statusIcon, { backgroundColor: theme.colors.warning + '20' }]}>
                  <Icon name="time-outline" size={20} color={theme.colors.warning} />
                </View>
                <Text style={[styles.checkinStatus, { color: theme.colors.warning }]}>Pendiente</Text>
              </TouchableOpacity>
            )}
          </Card>
        </View>

        {/* Widget de Salud Global */}
        <Card variant="elevated" padding="md">
          <Text style={[styles.widgetTitle, { color: theme.colors.text, marginBottom: 16 }]}>Métricas de Salud</Text>
          {latestCheckIn ? (
            <View style={styles.healthGrid}>
              <View style={styles.healthCard}>
                <Text style={styles.healthEmoji}>😴</Text>
                <Text style={[styles.healthValue, { color: theme.colors.text }]}>
                  {latestCheckIn.sleep_hours ? `${latestCheckIn.sleep_hours}h` : '-'}
                </Text>
                <Text style={[styles.healthLabel, { color: theme.colors.textSecondary }]}>Sueño</Text>
              </View>
              <View style={styles.healthCard}>
                <Text style={styles.healthEmoji}>💪</Text>
                <Text style={[styles.healthValue, { color: theme.colors.text }]}>
                  {latestCheckIn.exercised_today ? `${latestCheckIn.exercise_minutes || 0}m` : '-'}
                </Text>
                <Text style={[styles.healthLabel, { color: theme.colors.textSecondary }]}>Ejercicio</Text>
              </View>
              <View style={styles.healthCard}>
                <Text style={styles.healthEmoji}>👥</Text>
                <Text style={[styles.healthValue, { color: theme.colors.text }]}>
                  {latestCheckIn.social_interaction || '-'}
                </Text>
                <Text style={[styles.healthLabel, { color: theme.colors.textSecondary }]}>Social</Text>
              </View>
            </View>
          ) : (
            <Text style={[styles.noData, { color: theme.colors.textSecondary }]}>
              Registra tu salud en el check-in diario
            </Text>
          )}
        </Card>

        {/* Widget de Cravings Activos */}
        {dashboardData?.active_cravings && dashboardData.active_cravings.length > 0 && (
          <Card style={{ backgroundColor: theme.colors.warning + '10', borderColor: theme.colors.warning + '30', borderWidth: 1 }} padding="md">
            <View style={styles.cravingHeader}>
              <Icon name="alert-circle" size={24} color={theme.colors.warning} />
              <Text style={[styles.widgetTitle, { color: theme.colors.text, marginLeft: 8 }]}>Cravings Activos</Text>
            </View>
            <Text style={[styles.cravingCount, { color: theme.colors.warning }]}>
              {dashboardData.active_cravings.length} impulsos detectados
            </Text>
            <Button
              title="Hablar con NADA"
              variant="outline"
              size="sm"
              onPress={() => navigation.navigate('Chatbot')}
              style={{ marginTop: 12, borderColor: theme.colors.warning }}
              textStyle={{ color: theme.colors.warning }}
            />
          </Card>
        )}

        {/* Pared Familiar */}
        <Card variant="elevated" padding="md">
          <View style={styles.widgetHeader}>
            <Text style={[styles.widgetTitle, { color: theme.colors.text }]}>Muro Familiar</Text>
            <TouchableOpacity onPress={() => { /* Navegar */ }}>
              <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>Ver todo</Text>
            </TouchableOpacity>
          </View>

          {dashboardData?.wall_messages && dashboardData.wall_messages.length > 0 ? (
            <View style={styles.wallList}>
              {dashboardData.wall_messages.slice(0, 2).map((item) => (
                <View key={item.id} style={styles.wallItem}>
                  <LinearGradient
                    colors={[theme.colors.primary, theme.colors.primaryDark]}
                    style={styles.wallAvatar}
                  >
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>
                      {item.sender_name.charAt(0)}
                    </Text>
                  </LinearGradient>
                  <View style={styles.wallContent}>
                    <Text style={[styles.wallSender, { color: theme.colors.text }]}>
                      {item.sender_name} {item.emoji}
                    </Text>
                    <Text style={[styles.wallText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                      {item.message}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.noData, { color: theme.colors.textSecondary }]}>
              No hay mensajes nuevos hoy
            </Text>
          )}
        </Card>

        {/* Accesos Rápidos */}
        <View style={styles.quickActions}>
          <Button
            variant="primary"
            title="Hablar con NADA"
            icon={<Icon name="chatbubble-ellipses" size={20} color="white" />}
            onPress={() => navigation.navigate('Chatbot')}
            style={styles.actionButton}
          />
          <Button
            variant="secondary"
            title="Check-in"
            icon={<Icon name="add-circle" size={20} color="white" />}
            onPress={() => navigation.navigate('CheckIn')}
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  header: {
    marginTop: 10,
    marginBottom: 4,
  },
  welcomeSub: {
    fontSize: 14,
    textTransform: 'capitalize',
    marginBottom: 4,
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  actionCardsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  actionCard: {
    flex: 1,
    height: 70,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  actionCardText: {
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  badgeContainer: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  badgeTextSmall: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  widgetTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  widgetSub: {
    fontSize: 13,
    marginTop: 2,
  },
  moodBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  moodScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  moodItem: {
    alignItems: 'center',
    flex: 1,
  },
  divider: {
    width: 1,
    height: 30,
    opacity: 0.5,
  },
  moodLabel: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '500',
  },
  moodValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 20,
    gap: 8,
    justifyContent: 'center',
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  halfWidget: {
    justifyContent: 'center',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  checkinStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkinStatus: {
    fontSize: 16,
    fontWeight: '700',
  },
  healthGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  healthCard: {
    alignItems: 'center',
    flex: 1,
  },
  healthEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  healthValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  healthLabel: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  cravingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cravingCount: {
    fontSize: 15,
    fontWeight: '600',
  },
  wallList: {
    gap: 12,
  },
  wallItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#00000005',
    padding: 10,
    borderRadius: 16,
  },
  wallAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wallContent: {
    flex: 1,
  },
  wallSender: {
    fontSize: 14,
    fontWeight: '700',
  },
  wallText: {
    fontSize: 13,
    marginTop: 1,
  },
  noData: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
  },
});

export default DashboardScreen;
