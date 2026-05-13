import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Linking,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef } from 'react';
import { useMotivationalGreeting } from '@hooks/useMotivationalGreeting';
import { useTheme } from '@theme/ThemeContext';
import { Card, Button, Header } from '@components';
import { useCheckIn } from '@hooks/useCheckIn';
import { api } from '@services/api';
import { MainTabNavigationProp } from '@navigation/types';
import { DashboardData, ApiResponse } from '../../types/api';
import { JOURNAL_ENDPOINTS, SOS_CONFIG } from '@services/endpoints';
import Icon from '@expo/vector-icons/Ionicons';
import { BarChart, LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

interface FeedEntry {
  id: string;
  type: 'checkin' | 'note' | 'habit' | 'social' | 'activity' | 'analysis' | 'habit_completion';
  entry_date: string;
  created_at: string;
  data: Record<string, any>;
}

const FEED_TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  checkin: { label: 'Diario de Observación', icon: 'journal-outline', color: '#5D89BA' },
  note: { label: 'Nota Libre', icon: 'create-outline', color: '#8BAFD4' },
  habit: { label: 'Hábitos', icon: 'leaf-outline', color: '#5D89BA' },
  social: { label: 'Entorno Social', icon: 'people-outline', color: '#8BAFD4' },
  activity: { label: 'Actividad', icon: 'analytics-outline', color: '#94A3B8' },
  analysis: { label: 'Análisis de Consumo', icon: 'shield-half-outline', color: '#C07878' },
  habit_completion: {
    label: 'Hábito Completado',
    icon: 'checkmark-circle-outline',
    color: '#5D89BA',
  },
};

export const DashboardScreen: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MainTabNavigationProp>();
  const {
    todayCheckIn,
    checkIns,
    stats,
    streaks,
    hasCheckedInToday,
    getCurrentStreak,
    loadTodayCheckIn,
    loadCheckIns,
    loadStats,
    loadStreaks,
  } = useCheckIn();
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [feedData, setFeedData] = useState<FeedEntry[]>([]);
  const [habitsStatus, setHabitsStatus] = useState<any[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [loadingHabits, setLoadingHabits] = useState(false);
  const [totalSpent, setTotalSpent] = useState<number | null>(null);
  const {
    text: greetingText,
    isStreaming: greetingStreaming,
    done: greetingDone,
    fetchGreeting,
  } = useMotivationalGreeting();

  const [weeklyConsumption, setWeeklyConsumption] = useState<any[]>([]);
  const [dailyQuantity, setDailyQuantity] = useState<any[]>([]);
  const [loadingConsumption, setLoadingConsumption] = useState(false);

  const loadDashboardData = async () => {
    try {
      const response = await api.get<ApiResponse<DashboardData>>('/dashboard');
      if (response && response.success) setDashboardData(response.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  const loadExpensesSummary = async () => {
    try {
      const response = await api.get<ApiResponse<{ total: number }>>('/substance-expenses/summary');
      if (response && response.success && response.data) setTotalSpent(response.data.total);
    } catch (error) {
      console.error('Error loading expenses summary:', error);
    }
  };

  const loadFeed = async () => {
    setLoadingFeed(true);
    try {
      const response = await api.get<ApiResponse<FeedEntry[]>>(JOURNAL_ENDPOINTS.FEED, {
        limit: 5,
      });
      if (response && response.success) setFeedData(response.data || []);
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
      const response = await api.get<ApiResponse<any[]>>(
        `${JOURNAL_ENDPOINTS.HABITS_STATUS}?date=${today}`
      );
      if (response && response.success) setHabitsStatus(response.data || []);
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
        date: today,
      });
      if (response && response.success) {
        setHabitsStatus((prev) =>
          prev.map((h) => (h.id === habitId ? { ...h, is_completed: !h.is_completed } : h))
        );
      }
    } catch (error) {
      console.error('Error toggling habit:', error);
    }
  };

  const pulseAnim = useRef(new Animated.Value(1)).current;

  const startPulse = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const loadConsumptionStats = async () => {
    setLoadingConsumption(true);
    try {
      const weeklyRes = await api.get<ApiResponse<any[]>>('/consumption/stats/weekly');
      if (weeklyRes?.success && weeklyRes.data) setWeeklyConsumption(weeklyRes.data);

      const d = new Date();
      const localTodayDate = [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, '0'),
        String(d.getDate()).padStart(2, '0'),
      ].join('-');

      const dailyRes = await api.get<ApiResponse<any[]>>(
        `/consumption/stats/daily?date=${localTodayDate}`
      );
      if (dailyRes?.success && dailyRes.data) setDailyQuantity(dailyRes.data);
    } catch (error) {
      console.error('Error loading consumption stats:', error);
    } finally {
      setLoadingConsumption(false);
    }
  };

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
      loadConsumptionStats();
      fetchGreeting();
      startPulse();
    }, [loadTodayCheckIn, loadCheckIns, loadStats, loadStreaks, startPulse])
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
      loadExpensesSummary(),
      loadConsumptionStats(),
    ]);
    setRefreshing(false);
  };

  const currentStreak = getCurrentStreak();
  const latestCheckIn = todayCheckIn || (checkIns?.length > 0 ? checkIns[0] : null);
  const completedHabits = habitsStatus.filter((h) => h.is_completed).length;

  const renderFeedItem = (entry: FeedEntry) => {
    const config = FEED_TYPE_CONFIG[entry.type] || {
      label: 'Registro',
      icon: 'document-outline',
      color: theme.colors.textSecondary,
    };
    const entryDate = new Date(entry.entry_date + 'T12:00:00');
    const formattedDate = entryDate.toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'short',
    });

    return (
      <TouchableOpacity
        key={entry.id}
        style={[styles.feedItem, { borderBottomColor: theme.colors.border }]}
        onPress={() => navigation.navigate('CheckIn')}
        activeOpacity={0.6}
      >
        <View style={[styles.feedDot, { backgroundColor: config.color + '30' }]}>
          <View style={[styles.feedDotInner, { backgroundColor: config.color }]} />
        </View>
        <View style={styles.feedContent}>
          <Text style={[styles.feedLabel, { color: theme.colors.textSecondary }]}>
            {config.label}
          </Text>
          <Text style={[styles.feedText, { color: theme.colors.text }]} numberOfLines={1}>
            {entry.type === 'checkin'
              ? `Ánimo: ${entry.data.mood_score}/10`
              : entry.type === 'note'
                ? entry.data.content
                : entry.type === 'habit'
                  ? entry.data.protective_habits || entry.data.risk_habits
                  : entry.type === 'social'
                    ? entry.data.people_description
                    : entry.type === 'activity'
                      ? entry.data.activity_name
                      : entry.type === 'analysis'
                        ? 'Análisis de situación'
                        : entry.type === 'habit_completion'
                          ? entry.data.habit_name
                          : 'Registro diario'}
          </Text>
        </View>
        <Text style={[styles.feedDate, { color: theme.colors.textSecondary }]}>
          {formattedDate}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 110 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER SEGÚN MOCKUP */}
        <View style={styles.mockupHeader}>
          <View>
            <Text style={[styles.greetingLabel, { color: theme.colors.textSecondary }]}>
              {new Date().getHours() < 12 ? 'Buenos días,' : 'Buenas tardes,'}
            </Text>
            <Text style={[styles.userName, { color: theme.colors.text }]}>
              {dashboardData?.profile?.first_name || 'Amigx'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            style={[styles.avatarContainer, { backgroundColor: theme.colors.accent + '20' }]}
          >
            <Icon name="person" size={24} color={theme.colors.accent} />
          </TouchableOpacity>
        </View>

        {/* HERO: DÍAS SIN CONSUMO (RACHA) - ESTILIZADO Y ANIMADO */}
        <Animated.View
          style={[
            styles.sobrietyHeroAnimated,
            {
              backgroundColor: theme.colors.primary,
              ...theme.shadows.lg,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={[theme.gradients.primary[0], theme.gradients.primary[1]] as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sobrietyGradient}
          >
            <View style={styles.sobrietyContent}>
              <View style={styles.sobrietyCircleInner}>
                <Text style={styles.sobrietyDaysLarge}>{currentStreak}</Text>
              </View>
              <View style={styles.sobrietyTextCol}>
                <Text style={styles.sobrietyLabelLight}>DÍAS DE LIBERTAD</Text>
                <Text style={styles.sobrietyTagline}>Tu camino de paz continúa</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* LÚA HERO BLOCK - Solo nombre en grande */}
        <TouchableOpacity
          style={[styles.luaHeroClean, { backgroundColor: theme.colors.card, ...theme.shadows.sm }]}
          onPress={() => navigation.navigate('Chatbot')}
          activeOpacity={0.8}
        >
          <View style={styles.luaHeaderSimple}>
            <Text style={[styles.luaNameBig, { color: theme.colors.primary }]}>LÚA</Text>
            {greetingStreaming && (
              <View style={[styles.streamPulse, { backgroundColor: theme.colors.primary }]} />
            )}
          </View>
          <Text style={[styles.luaTextSimple, { color: theme.colors.text }]}>
            {greetingText || 'Toca para una sesión de calma con LÚA'}
          </Text>
        </TouchableOpacity>

        {/* GRID 2x2: HÁBITOS, ÁNIMO, GASTOS, AYUDA */}
        <View style={styles.grid2x2}>
          <View style={styles.gridRow}>
            {/* Hábitos */}
            <TouchableOpacity
              style={[styles.gridCard, { backgroundColor: theme.colors.primary }]}
              onPress={() => navigation.navigate('CheckIn')}
              activeOpacity={0.9}
            >
              <View style={[styles.iconBox, { backgroundColor: '#FFFFFFE6' }]}>
                <Icon name="leaf" size={24} color="#4CAF50" />
              </View>
              <View>
                <Text style={styles.gridCardValue}>
                  {completedHabits}/{habitsStatus.length || 0}
                </Text>
                <Text style={styles.gridCardLabel}>Hábitos</Text>
              </View>
            </TouchableOpacity>

            {/* Ánimo */}
            <TouchableOpacity
              style={[styles.gridCard, { backgroundColor: theme.colors.secondary }]}
              onPress={() => navigation.navigate('CheckIn')}
              activeOpacity={0.9}
            >
              <View style={[styles.iconBox, { backgroundColor: '#FFFFFFE6' }]}>
                <Icon name="pulse" size={24} color="#F44336" />
              </View>
              <View>
                <Text style={styles.gridCardValue}>{latestCheckIn?.mood_score ?? '—'}</Text>
                <Text style={styles.gridCardLabel}>Ánimo</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.gridRow}>
            {/* Gastos */}
            <TouchableOpacity
              style={[styles.gridCard, { backgroundColor: theme.colors.accent }]}
              onPress={() => navigation.navigate('CheckIn', { screen: 'SubstanceExpense' } as any)}
              activeOpacity={0.9}
            >
              <View style={[styles.iconBox, { backgroundColor: '#FFFFFFE6' }]}>
                <Icon name="wallet" size={24} color="#795548" />
              </View>
              <View>
                <Text style={[styles.gridCardValue, { fontSize: 13 }]}>
                  {totalSpent !== null ? `$${totalSpent.toLocaleString('es-CL')}` : '—'}
                </Text>
                <Text style={styles.gridCardLabel}>Gastos</Text>
              </View>
            </TouchableOpacity>

            {/* Pedir Ayuda - SOS */}
            <TouchableOpacity
              style={[styles.gridCard, { backgroundColor: theme.colors.error }]}
              onPress={() => Linking.openURL(`tel:${SOS_CONFIG.PHONE}`)}
              activeOpacity={0.9}
            >
              <View style={[styles.iconBox, { backgroundColor: '#FFFFFFE6' }]}>
                <Icon name="megaphone" size={24} color="#FF9800" />
              </View>
              <View>
                <Text style={styles.gridCardValue}>SOS</Text>
                <Text style={styles.gridCardLabel}>Pedir Ayuda</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── IMPULSOS ── */}
        {dashboardData?.active_cravings && dashboardData.active_cravings.length > 0 && (
          <View
            style={[
              styles.alertBanner,
              {
                backgroundColor: theme.colors.warning + '0A',
                borderColor: theme.colors.warning + '30',
              },
            ]}
          >
            <Icon name="alert-circle-outline" size={18} color={theme.colors.warning} />
            <Text style={[styles.alertText, { color: theme.colors.text }]}>
              Tienes {dashboardData.active_cravings.length} impulso
              {dashboardData.active_cravings.length > 1 ? 's' : ''} registrado
              {dashboardData.active_cravings.length > 1 ? 's' : ''} hoy
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Chatbot')} activeOpacity={0.7}>
              <Text style={[styles.alertAction, { color: theme.colors.primary }]}>
                Habla con LÚA
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── HÁBITOS SCROLL ── */}
        {habitsStatus.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Hábitos de hoy
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('CheckIn')}>
                <Text style={[styles.sectionAction, { color: theme.colors.primary }]}>
                  Gestionar
                </Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingRight: 4 }}
            >
              {habitsStatus.map((habit) => (
                <TouchableOpacity
                  key={habit.id}
                  style={[
                    styles.habitChip,
                    {
                      backgroundColor: habit.is_completed
                        ? theme.colors.primary
                        : theme.colors.card,
                      borderColor: habit.is_completed ? theme.colors.primary : theme.colors.border,
                    },
                  ]}
                  onPress={() => toggleHabit(habit.id)}
                  activeOpacity={0.75}
                >
                  <Icon
                    name={habit.is_completed ? 'checkmark' : 'ellipse-outline'}
                    size={13}
                    color={habit.is_completed ? 'white' : theme.colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.habitChipText,
                      { color: habit.is_completed ? 'white' : theme.colors.text },
                    ]}
                  >
                    {habit.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── BITÁCORA ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Mi bitácora</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CheckIn')}>
              <Text style={[styles.sectionAction, { color: theme.colors.primary }]}>Ver todo</Text>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.feedContainer,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
                ...theme.shadows.sm,
              },
            ]}
          >
            {loadingFeed ? (
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                Cargando…
              </Text>
            ) : feedData.length > 0 ? (
              feedData.map(renderFeedItem)
            ) : (
              <View style={styles.emptyFeed}>
                <Icon name="book-outline" size={32} color={theme.colors.border} />
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                  Sin registros recientes
                </Text>
                <Button
                  title="Añadir registro"
                  size="sm"
                  variant="outline"
                  onPress={() => navigation.navigate('CheckIn')}
                  style={{ marginTop: 12 }}
                />
              </View>
            )}
          </View>
        </View>

        {/* ── ANÁLISIS DE CONSUMO ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Análisis de consumo
          </Text>

          {loadingConsumption ? (
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary, marginTop: 8 }]}>
              Cargando estadísticas…
            </Text>
          ) : (
            <>
              {weeklyConsumption.length > 0 && (
                <Card variant="elevated" padding="md" style={{ marginTop: 12, gap: 8 }}>
                  <Text style={[styles.chartLabel, { color: theme.colors.textSecondary }]}>
                    Variación semanal (intensidad)
                  </Text>
                  <BarChart
                    data={{
                      labels: weeklyConsumption.map((d) => {
                        const date = new Date(d.date + 'T12:00:00');
                        return ['D', 'L', 'M', 'M', 'J', 'V', 'S'][date.getDay()];
                      }),
                      datasets: [
                        { data: weeklyConsumption.map((d) => Number(d.total_quantity) || 0) },
                      ],
                    }}
                    width={screenWidth - 80}
                    height={140}
                    yAxisLabel=""
                    yAxisSuffix=""
                    fromZero
                    withInnerLines={false}
                    chartConfig={{
                      backgroundColor: theme.colors.card,
                      backgroundGradientFrom: theme.colors.card,
                      backgroundGradientTo: theme.colors.card,
                      decimalPlaces: 0,
                      color: () => theme.colors.primary,
                      labelColor: () => theme.colors.textSecondary,
                      barPercentage: 0.5,
                    }}
                    style={{ borderRadius: 12, marginLeft: -20 }}
                  />
                </Card>
              )}

              {dailyQuantity.length > 0 && (
                <Card variant="elevated" padding="md" style={{ marginTop: 10, gap: 8 }}>
                  <Text style={[styles.chartLabel, { color: theme.colors.textSecondary }]}>
                    Cantidades hoy (por hora)
                  </Text>
                  <LineChart
                    data={{
                      labels: dailyQuantity
                        .filter((d) => parseInt(d.hour) % 4 === 0)
                        .map((d) => `${d.hour}h`),
                      datasets: [
                        {
                          data: dailyQuantity
                            .filter((d) => parseInt(d.hour) % 4 === 0)
                            .map((d) => Number(d.total_quantity) || 0),
                        },
                      ],
                    }}
                    width={screenWidth - 60}
                    height={140}
                    yAxisLabel=""
                    yAxisSuffix=""
                    fromZero
                    withInnerLines={false}
                    chartConfig={{
                      backgroundColor: theme.colors.card,
                      backgroundGradientFrom: theme.colors.card,
                      backgroundGradientTo: theme.colors.card,
                      decimalPlaces: 1,
                      color: () => theme.colors.secondary,
                      labelColor: () => theme.colors.textSecondary,
                      propsForDots: { r: '3', strokeWidth: '1', stroke: theme.colors.secondary },
                    }}
                    bezier
                    style={{ borderRadius: 12, marginLeft: -20 }}
                  />
                </Card>
              )}

              {weeklyConsumption.length === 0 && dailyQuantity.length === 0 && (
                <Text
                  style={[styles.emptyText, { color: theme.colors.textSecondary, marginTop: 8 }]}
                >
                  Registra consumos para ver tus estadísticas.
                </Text>
              )}
            </>
          )}
        </View>

        {/* ── MURO FAMILIAR ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Muro familiar</Text>
          </View>
          <Card variant="elevated" padding="md">
            {dashboardData?.wall_messages && dashboardData.wall_messages.length > 0 ? (
              <View style={{ gap: 10 }}>
                {dashboardData.wall_messages.slice(0, 2).map((item) => (
                  <View
                    key={item.id}
                    style={[styles.wallItem, { backgroundColor: theme.colors.primary + '08' }]}
                  >
                    <View
                      style={[styles.wallAvatar, { backgroundColor: theme.colors.primary + '20' }]}
                    >
                      <Text style={[styles.wallAvatarText, { color: theme.colors.primary }]}>
                        {item.sender_name.charAt(0)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.wallSender, { color: theme.colors.text }]}>
                        {item.sender_name} {item.emoji}
                      </Text>
                      <Text
                        style={[styles.wallText, { color: theme.colors.textSecondary }]}
                        numberOfLines={1}
                      >
                        {item.message}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                No hay mensajes nuevos hoy
              </Text>
            )}
          </Card>
        </View>

        {/* ── ACCIONES RÁPIDAS ── */}
        <View style={styles.quickActions}>
          <Button
            variant="primary"
            title="Hablar con LÚA"
            icon={<Icon name="chatbubble-ellipses-outline" size={18} color="white" />}
            onPress={() => navigation.navigate('Chatbot')}
            style={styles.quickBtn}
          />
          <Button
            variant="outline"
            title="Nuevo registro"
            icon={<Icon name="add-outline" size={18} color={theme.colors.primary} />}
            onPress={() => navigation.navigate('CheckIn')}
            style={styles.quickBtn}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    gap: 20,
  },

  // ── MOCKUP ELEMENTS ──
  mockupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  greetingLabel: {
    fontSize: 18,
    fontWeight: '300',
  },
  userName: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: -2,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sobrietyHeroAnimated: {
    borderRadius: 32,
    overflow: 'hidden',
    marginBottom: 8,
  },
  sobrietyGradient: {
    padding: 24,
  },
  sobrietyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  sobrietyCircleInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sobrietyDaysLarge: {
    fontSize: 42,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -1,
  },
  sobrietyTextCol: {
    flex: 1,
    gap: 4,
  },
  sobrietyLabelLight: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 2,
  },
  sobrietyTagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontStyle: 'italic',
  },

  // ── LÚA CLEAN ──
  luaHeroClean: {
    borderRadius: 24,
    padding: 20,
    gap: 12,
  },
  luaHeaderSimple: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  luaNameBig: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 4,
  },
  luaTextSimple: {
    fontSize: 16,
    fontWeight: '300',
    lineHeight: 24,
    opacity: 0.9,
  },

  // ── GRID 2x2 ──
  grid2x2: {
    gap: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gridCard: {
    flex: 1,
    borderRadius: 24,
    padding: 20,
    gap: 12,
    justifyContent: 'space-between',
    minHeight: 120,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridCardValue: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
  },
  gridCardLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // ── LÚA ──
  luaHero: {
    borderRadius: 24,
    padding: 18,
    gap: 12,
    marginTop: 8,
  },
  luaTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  luaAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  luaAvatarInfo: { flex: 1 },
  luaName: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  luaRole: {
    fontSize: 10,
    marginTop: 1,
  },
  streamPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  luaText: {
    fontSize: 15,
    fontWeight: '300',
    lineHeight: 22,
  },

  // ── MÉTRICAS ──
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 10,
  },
  metricCard: {
    flex: 1,
    borderRadius: 18,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 6,
    gap: 6,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '400',
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '400',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // ── SOS ──
  sosCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    marginVertical: 10,
  },
  sosText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // ── ALERT ──
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  alertText: {
    flex: 1,
    fontSize: 12,
  },
  alertAction: {
    fontSize: 12,
    fontWeight: '600',
  },

  // ── SECCIONES ──
  section: { gap: 10, marginTop: 10 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '300',
    letterSpacing: -0.3,
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: '400',
  },

  // ── HÁBITOS ──
  habitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  habitChipText: {
    fontSize: 12,
  },

  // ── FEED ──
  feedContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  feedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  feedDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  feedContent: { flex: 1 },
  feedLabel: {
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  feedText: {
    fontSize: 14,
    fontWeight: '300',
  },
  feedDate: {
    fontSize: 10,
  },
  emptyFeed: {
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },

  // ── CHARTS ──
  chartLabel: {
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 0.5,
  },

  // ── MURO ──
  wallItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 18,
  },
  wallAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wallAvatarText: {
    fontSize: 14,
    fontWeight: '600',
  },
  wallSender: {
    fontSize: 12,
    fontWeight: '600',
  },
  wallText: {
    fontSize: 11,
    marginTop: 2,
  },

  // ── ACCIONES ──
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  quickBtn: { flex: 1 },
});

export default DashboardScreen;
