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
import { JOURNAL_ENDPOINTS } from '@services/endpoints';
import Icon from '@expo/vector-icons/Ionicons';

// Tipo para las entradas del feed unificado
interface FeedEntry {
  id: string;
  type: 'checkin' | 'note' | 'habit' | 'social' | 'activity' | 'analysis' | 'habit_completion';
  entry_date: string;
  created_at: string;
  data: Record<string, any>;
}

// Mapeo de tipos a información de visualización
const FEED_TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  checkin: { label: 'Diario de Observación', icon: 'journal-outline', color: '#007AFF' },
  note: { label: 'Nota Libre', icon: 'create-outline', color: '#34C759' },
  habit: { label: 'Hábitos', icon: 'leaf-outline', color: '#34C759' },
  social: { label: 'Entorno Social', icon: 'people-outline', color: '#007AFF' },
  activity: { label: 'Actividad', icon: 'analytics-outline', color: '#FF9500' },
  analysis: { label: 'Análisis de Consumo', icon: 'shield-half-outline', color: '#FF3B30' },
  habit_completion: { label: 'Hábito Completado', icon: 'checkmark-circle-outline', color: '#34C759' },
};

export const DashboardScreen: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MainTabNavigationProp>();
  const { todayCheckIn, checkIns, stats, streaks, hasCheckedInToday, getCurrentStreak, loadTodayCheckIn, loadCheckIns, loadStats, loadStreaks } = useCheckIn();
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [feedData, setFeedData] = useState<FeedEntry[]>([]);
  const [habitsStatus, setHabitsStatus] = useState<any[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [loadingHabits, setLoadingHabits] = useState(false);
  const [totalSpent, setTotalSpent] = useState<number | null>(null);

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

  const loadExpensesSummary = async () => {
    try {
      const response = await api.get<ApiResponse<{ total: number }>>('/substance-expenses/summary');
      if (response && response.success && response.data) {
        setTotalSpent(response.data.total);
      }
    } catch (error) {
      console.error('Error loading expenses summary:', error);
    }
  };

  const loadFeed = async () => {
    setLoadingFeed(true);
    try {
      const response = await api.get<ApiResponse<FeedEntry[]>>(JOURNAL_ENDPOINTS.FEED, { limit: 5 });
      if (response && response.success) {
        setFeedData(response.data || []);
      }
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoadingFeed(false);
    }
  };

  const loadHabitsStatus = async () => {
    setLoadingHabits(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get<ApiResponse<any[]>>(`${JOURNAL_ENDPOINTS.HABITS_STATUS}?date=${today}`);
      if (response && response.success) {
        setHabitsStatus(response.data || []);
      }
    } catch (error) {
      console.error('Error loading habits:', error);
    } finally {
      setLoadingHabits(false);
    }
  };

  const toggleHabit = async (habitId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await api.post<ApiResponse<any>>(JOURNAL_ENDPOINTS.HABIT_TOGGLE, {
        habit_id: habitId,
        date: today
      });
      if (response && response.success) {
        // Actualización optimista
        setHabitsStatus(prev => prev.map(h => 
          h.id === habitId ? { ...h, is_completed: !h.is_completed } : h
        ));
      }
    } catch (error) {
      console.error('Error toggling habit:', error);
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
      loadFeed();
      loadHabitsStatus();
      loadExpensesSummary();
    }, [loadTodayCheckIn, loadCheckIns, loadStats, loadStreaks])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadDashboardData(), 
      loadTodayCheckIn(), 
      loadCheckIns(1, 10), 
      loadStats(30), 
      loadStreaks(),
      loadFeed(),
      loadHabitsStatus(),
      loadExpensesSummary()
    ]);
    setRefreshing(false);
  };

  const currentStreak = getCurrentStreak();
  const longestStreak = streaks.find(s => s.streak_type === 'checkin_completed')?.longest_streak || 0;
  
  const latestCheckIn = todayCheckIn || (checkIns?.length > 0 ? checkIns[0] : null);

  const renderFeedItem = (entry: FeedEntry) => {
    const config = FEED_TYPE_CONFIG[entry.type] || { label: 'Registro', icon: 'document-outline', color: '#8E8E93' };
    const entryDate = new Date(entry.entry_date + 'T12:00:00');
    const formattedDate = entryDate.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' });

    return (
      <TouchableOpacity 
        key={entry.id} 
        style={[styles.feedItemShort, { backgroundColor: theme.colors.card }]}
        onPress={() => navigation.navigate('CheckIn')}
        activeOpacity={0.7}
      >
        <View style={[styles.feedIconCircle, { backgroundColor: config.color + '15' }]}>
          <Icon name={config.icon as any} size={18} color={config.color} />
        </View>
        <View style={styles.feedContentShort}>
          <Text style={[styles.feedLabel, { color: theme.colors.textSecondary }]}>{config.label}</Text>
          <Text style={[styles.feedTextShort, { color: theme.colors.text }]} numberOfLines={1}>
            {entry.type === 'checkin' ? `Ánimo: ${entry.data.mood_score}/10` : 
             entry.type === 'note' ? entry.data.content :
             entry.type === 'habit' ? (entry.data.protective_habits || entry.data.risk_habits) :
             entry.type === 'social' ? entry.data.people_description :
             entry.type === 'activity' ? entry.data.activity_name :
             entry.type === 'analysis' ? 'Análisis de situación' :
             entry.type === 'habit_completion' ? entry.data.habit_name : 'Registro diario'}
          </Text>
        </View>
        <Text style={[styles.feedDate, { color: theme.colors.textSecondary }]}>{formattedDate}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[theme.colors.primary + '15', theme.colors.background]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        style={{ flex: 1, paddingTop: insets.top }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        {/* Header de Bienvenida */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.welcomeSub, { color: theme.colors.textSecondary }]}>
                {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
              </Text>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                ¡{dashboardData?.profile?.first_name ? `Hola ${dashboardData.profile.first_name}` : 'Bienvenido'}!
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.profileButton, { backgroundColor: theme.colors.card }]}
              onPress={() => navigation.navigate('Profile')}
            >
              <Icon name="person-circle-outline" size={32} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
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

        {/* Resumen del Día */}
        <View style={styles.summaryGrid}>
          <Card style={styles.summaryCard} padding="md">
            <Icon name="flame" size={24} color={theme.colors.accent} />
            <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{currentStreak}</Text>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Racha</Text>
          </Card>
          <Card style={styles.summaryCard} padding="md">
            <Icon name="leaf" size={24} color={theme.colors.success} />
            <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
              {habitsStatus.filter(h => h.is_completed).length}/{habitsStatus.length || 0}
            </Text>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Hábitos</Text>
          </Card>
          <Card style={styles.summaryCard} padding="md">
            <Icon name="pulse" size={24} color={theme.colors.primary} />
            <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{latestCheckIn?.mood_score || '-'}/10</Text>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Ánimo</Text>
          </Card>
          <Card 
            style={styles.summaryCard} 
            padding="md"
            onPress={() => navigation.navigate('CheckIn', { screen: 'SubstanceExpense' } as any)}
          >
            <Icon name="wallet" size={24} color={theme.colors.error} />
            <Text style={[styles.summaryValue, { color: theme.colors.text, fontSize: 14 }]}>
              {totalSpent !== null ? `$${totalSpent.toLocaleString('es-CL')}` : '-'}
            </Text>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Gastos</Text>
          </Card>
        </View>

        {/* Hábitos de Hoy */}
        {habitsStatus.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Hábitos de Hoy</Text>
              <TouchableOpacity onPress={() => navigation.navigate('CheckIn')}>
                <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>Gestionar</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.habitsRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {habitsStatus.map(habit => (
                  <TouchableOpacity
                    key={habit.id}
                    style={[
                      styles.habitBubble,
                      { 
                        backgroundColor: habit.is_completed ? theme.colors.primary : theme.colors.card,
                        borderColor: habit.is_completed ? theme.colors.primary : theme.colors.border,
                        borderWidth: 1
                      }
                    ]}
                    onPress={() => toggleHabit(habit.id)}
                    activeOpacity={0.8}
                  >
                    <Icon 
                      name={habit.habit_type === 'positive' ? 'add-circle' : 'remove-circle'} 
                      size={16} 
                      color={habit.is_completed ? 'white' : theme.colors.textSecondary} 
                    />
                    <Text style={[styles.habitBubbleText, { color: habit.is_completed ? 'white' : theme.colors.text }]}>
                      {habit.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Bitácora */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Mi Bitácora</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CheckIn')}>
              <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>Ver todo</Text>
            </TouchableOpacity>
          </View>
          
          <Card variant="elevated" padding="sm" style={styles.feedCard}>
            {loadingFeed ? (
              <View style={styles.loadingContainer}><Text style={{ color: theme.colors.textSecondary }}>Cargando bitácora...</Text></View>
            ) : feedData.length > 0 ? (
              <View>
                {feedData.map(renderFeedItem)}
              </View>
            ) : (
              <View style={styles.emptyFeed}>
                <Icon name="calendar-outline" size={40} color={theme.colors.textSecondary + '40'} />
                <Text style={[styles.noData, { color: theme.colors.textSecondary }]}>
                  No hay registros recientes.
                </Text>
                <Button 
                  title="Añadir primero" 
                  size="sm" 
                  variant="outline" 
                  onPress={() => navigation.navigate('CheckIn')} 
                  style={{ marginTop: 12 }}
                />
              </View>
            )}
          </Card>
        </View>

        {/* Widget de Cravings Activos (TERMINOLOGÍA ACTUALIZADA: Impulsos/Consumo) */}
        {dashboardData?.active_cravings && dashboardData.active_cravings.length > 0 && (
          <Card style={{ backgroundColor: theme.colors.warning + '10', borderColor: theme.colors.warning + '30', borderWidth: 1 }} padding="md">
            <View style={styles.cravingHeader}>
              <Icon name="alert-circle" size={24} color={theme.colors.warning} />
              <Text style={[styles.widgetTitle, { color: theme.colors.text, marginLeft: 8 }]}>Impulsos Detectados</Text>
            </View>
            <Text style={[styles.cravingCount, { color: theme.colors.warning }]}>
              Tienes {dashboardData.active_cravings.length} impulsos registrados hoy
            </Text>
            <Button
              title="Hablar con LÚA"
              variant="outline"
              size="sm"
              onPress={() => navigation.navigate('Chatbot')}
              style={{ marginTop: 12, borderColor: theme.colors.warning }}
              textStyle={{ color: theme.colors.warning }}
            />
          </Card>
        )}

        {/* Muro Familiar */}
        <Card variant="elevated" padding="md">
          <View style={styles.widgetHeader}>
            <Text style={[styles.widgetTitle, { color: theme.colors.text }]}>Muro Familiar</Text>
            <TouchableOpacity onPress={() => { /* Navegar a Familia */ }}>
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
            title="Hablar con LÚA"
            icon={<Icon name="chatbubble-ellipses" size={20} color="white" />}
            onPress={() => navigation.navigate('Chatbot')}
            style={styles.actionButton}
          />
          <Button
            variant="secondary"
            title="Nuevo Registro"
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00000010',
  },
  welcomeSub: {
    fontSize: 14,
    textTransform: 'capitalize',
    marginBottom: 2,
    fontWeight: '500',
  },
  title: {
    fontSize: 26,
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
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  habitsRow: {
    marginTop: 4,
  },
  habitBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  habitBubbleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  feedCard: {
    overflow: 'hidden',
  },
  feedItemShort: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#00000008',
    gap: 12,
  },
  feedIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedContentShort: {
    flex: 1,
  },
  feedLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  feedTextShort: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 1,
  },
  feedDate: {
    fontSize: 11,
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyFeed: {
    padding: 30,
    alignItems: 'center',
    gap: 4,
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  widgetTitle: {
    fontSize: 18,
    fontWeight: '700',
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
