import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme/ThemeContext';
import Icon from '@expo/vector-icons/Ionicons';
import { api } from '@services/api';
import { ApiResponse } from '../../types/api';
import { Card } from '@components';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

const EMOTION_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  happiness: { label: 'Felicidad', icon: 'happy-outline', color: '#4CAF50' },
  surprise: { label: 'Sorpresa', icon: 'alert-circle-outline', color: '#FF9800' },
  fear: { label: 'Miedo', icon: 'skull-outline', color: '#9C27B0' },
  anger: { label: 'Ira', icon: 'flame-outline', color: '#F44336' },
  disgust: { label: 'Asco', icon: 'close-circle-outline', color: '#795548' },
  sadness: { label: 'Tristeza', icon: 'water-outline', color: '#2196F3' },
};

const TAG_TRANSLATIONS: Record<string, string> = {
  // Felicidad
  happy: 'feliz',
  content: 'contento',
  joyful: 'alegre',
  satisfied: 'satisfecho',
  hopeful: 'esperanzado',
  motivated: 'motivado',
  enthusiastic: 'entusiasta',
  proud: 'orgulloso',
  grateful: 'agradecido',
  loving: 'amoroso',
  affectionate: 'cariñoso',
  connected: 'conectado',
  calm: 'tranquilo',
  peaceful: 'en paz',
  relaxed: 'relajado',
  serene: 'sereno',
  at_peace: 'en calma',
  comfortable: 'cómodo',
  safe: 'seguro',
  confident: 'confiado',
  vital: 'vital',
  active: 'activo',
  energetic: 'energético',
  inspired: 'inspirado',
  reflective: 'reflexivo',
  physical_well: 'bien físico',
  // Miedo
  anxious: 'ansioso',
  nervous: 'nervioso',
  worried: 'preocupado',
  frightened: 'asustado',
  fearful: 'temeroso',
  uncertain: 'incierto',
  overwhelmed: 'abrumado',
  panic: 'pánico',
  burdened: 'agobiado',
  restless: 'inquieto',
  vulnerable: 'vulnerable',
  pressured: 'presionado',
  rushed: 'apurado',
  swamped: 'sobrepasado',
  // Ira
  angry: 'enojado',
  frustrated: 'frustrado',
  irritated: 'irritado',
  annoyed: 'molesto',
  furious: 'furioso',
  resentful: 'resentido',
  bitter: 'amargado',
  indignant: 'indignado',
  stressed: 'estresado',
  tense: 'tenso',
  blocked: 'bloqueado',
  // Tristeza
  sad: 'triste',
  melancholy: 'melancólico',
  down: 'decaído',
  dejected: 'desanimado',
  hopeless: 'sin esperanza',
  lonely: 'solitario',
  isolated: 'aislado',
  empty: 'vacío',
  nostalgic: 'nostálgico',
  missing: 'extrañando',
  tired: 'cansado',
  exhausted: 'agotado',
  drained: 'agotado',
  worn_out: 'drenado',
  sleepy: 'somnoliento',
  physical_bad: 'malestar físico',
  // Sorpresa
  surprised: 'sorprendido',
  amazed: 'asombrado',
  anticipating: 'expectante',
  curious: 'curioso',
  confused: 'confundido',
  // Asco
  disgust: 'disgusto',
  disapproving: 'desaprobando',
  disappointed: 'decepcionado',
  awful: 'horrible',
  withdrawal: 'retirada',
};

/**
 * ProgressScreen - Visualización de estadísticas y progreso de recuperación.
 * Diseño Zen Bluish: Uniforme, limpio y profesional.
 */
export const ProgressScreen: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [stats, setStats] = useState<any>(null);
  const [habitStats, setHabitStats] = useState<any[]>([]);
  const [cravingStats, setCravingStats] = useState<any>(null);
  const [moodHistory, setMoodHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'recovery' | 'emotions' | 'habits'>('recovery');

  useEffect(() => {
    fetchAllStats();
  }, []);

  const fetchAllStats = async () => {
    setLoading(true);
    try {
      const [statsRes, habitRes, cravingRes, moodRes] = await Promise.all([
        api.get<ApiResponse<any>>('/checkins/stats?days=30'),
        api.get<ApiResponse<any[]>>('/journal/habits/stats?days=30'),
        api.get<ApiResponse<any>>('/cravings/stats'),
        api.get<ApiResponse<any[]>>('/checkins/mood-history?days=30'),
      ]);

      if (statsRes?.success) setStats(statsRes.data);
      if (habitRes?.success) setHabitStats(habitRes.data || []);
      if (cravingRes?.success) setCravingStats(cravingRes.data);
      if (moodRes?.success) setMoodHistory(moodRes.data || []);
    } catch (error) {
      console.error('Error fetching progress stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={[styles.backButton, { backgroundColor: theme.colors.card }]}
      >
        <Icon name="chevron-back" size={24} color={theme.colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Mi Progreso</Text>
      <View style={{ width: 44 }} />
    </View>
  );

  const renderTabs = () => (
    <View
      style={[
        styles.tabsContainer,
        { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
      ]}
    >
      {(['recovery', 'emotions', 'habits'] as const).map((tab) => (
        <TouchableOpacity
          key={tab}
          onPress={() => setActiveTab(tab)}
          style={[styles.tab, activeTab === tab && { backgroundColor: theme.colors.primary }]}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === tab ? 'white' : theme.colors.textSecondary },
            ]}
          >
            {tab === 'recovery' ? 'Status' : tab === 'emotions' ? 'Ánimo' : 'Hábitos'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderRecoveryTab = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={[styles.heroCard, { backgroundColor: theme.colors.primary }]}>
        <Text style={styles.heroLabel}>Días en recuperación</Text>
        <Text style={styles.heroValue}>{stats?.totalCheckIns || 0}</Text>
        <View style={styles.heroFooter}>
          <Icon name="ribbon-outline" size={20} color="white" />
          <Text style={styles.heroSubtext}>Excelente ritmo este mes</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <Card style={styles.statBox}>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {stats?.exerciseDays || 0}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Días activos
          </Text>
        </Card>
        <Card style={styles.statBox}>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            {stats?.riskSituations || 0}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Riesgos</Text>
        </Card>
      </View>

      <Card padding="lg" style={{ marginTop: 10 }}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Consumo Semanal</Text>
        <View style={styles.placeholderChart}>
          <Icon name="stats-chart-outline" size={32} color={theme.colors.border} />
          <Text style={{ color: theme.colors.textSecondary, marginTop: 8 }}>
            Estadísticas de 7 días
          </Text>
        </View>
      </Card>
    </ScrollView>
  );

  const renderEmotionsTab = () => {
    const emotionDistribution = stats?.emotionDistribution || {};
    const totalEmotions = Object.values(emotionDistribution).reduce(
      (a: number, b: any) => a + (b as number),
      0
    ) as number;

    const sortedEmotions = Object.entries(emotionDistribution)
      .filter(([_, count]) => (count as number) > 0)
      .sort((a, b) => (b[1] as number) - (a[1] as number));

    const topEmotion = sortedEmotions[0]?.[0] as string | undefined;
    const topEmotionConfig = topEmotion ? EMOTION_CONFIG[topEmotion] : null;

    const moodTrend = moodHistory.slice().reverse().slice(-7);

    const trendLabels = moodTrend.map((m) => {
      const d = new Date(m.mood_date);
      return ['D', 'L', 'M', 'M', 'J', 'V', 'S'][d.getDay()];
    });

    const moodScores = moodTrend.map((m) => m.mood_score || 0);
    const anxietyScores = moodTrend.map((m) => m.anxiety_score || 0);

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card padding="lg">
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Estado de Ánimo</Text>
          <View style={styles.moodRow}>
            <View style={styles.moodItem}>
              <Text style={[styles.moodValue, { color: theme.colors.primary }]}>
                {stats?.averageMood?.toFixed(1) || '0.0'}
              </Text>
              <Text style={[styles.moodLabel, { color: theme.colors.textSecondary }]}>Ánimo</Text>
            </View>
            <View style={styles.moodItem}>
              <Text style={[styles.moodValue, { color: theme.colors.secondary }]}>
                {stats?.averageEnergy?.toFixed(1) || '0.0'}
              </Text>
              <Text style={[styles.moodLabel, { color: theme.colors.textSecondary }]}>Energía</Text>
            </View>
            <View style={styles.moodItem}>
              <Text style={[styles.moodValue, { color: theme.colors.accent || '#9C27B0' }]}>
                {stats?.averageAnxiety?.toFixed(1) || '0.0'}
              </Text>
              <Text style={[styles.moodLabel, { color: theme.colors.textSecondary }]}>
                Ansiedad
              </Text>
            </View>
            <View style={styles.moodItem}>
              <Text style={[styles.moodValue, { color: '#3B82F6' }]}>
                {stats?.averageSleep?.toFixed(1) || '0.0'}
              </Text>
              <Text style={[styles.moodLabel, { color: theme.colors.textSecondary }]}>
                Sueño (h)
              </Text>
            </View>
          </View>
        </Card>

        {topEmotionConfig && (
          <Card padding="lg" style={{ marginTop: 16 }}>
            <View
              style={[styles.topEmotionBanner, { backgroundColor: topEmotionConfig.color + '12' }]}
            >
              <Icon name={topEmotionConfig.icon as any} size={24} color={topEmotionConfig.color} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.topEmotionLabel, { color: theme.colors.textSecondary }]}>
                  Emoción predominante
                </Text>
                <Text style={[styles.topEmotionName, { color: topEmotionConfig.color }]}>
                  {topEmotionConfig.label}
                </Text>
              </View>
            </View>
          </Card>
        )}

        <Card padding="lg" style={{ marginTop: 16 }}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Distribución Emocional
          </Text>
          {sortedEmotions.length > 0 ? (
            <View style={{ marginTop: 16, gap: 14 }}>
              {sortedEmotions.map(([emotion, count]) => {
                const config = EMOTION_CONFIG[emotion];
                if (!config) return null;
                const percentage =
                  totalEmotions > 0 ? ((count as number) / totalEmotions) * 100 : 0;
                return (
                  <View key={emotion}>
                    <View style={styles.emotionRow}>
                      <View style={styles.emotionLabelRow}>
                        <Icon name={config.icon as any} size={16} color={config.color} />
                        <Text style={[styles.emotionLabel, { color: theme.colors.text }]}>
                          {config.label}
                        </Text>
                      </View>
                      <Text style={[styles.emotionCount, { color: theme.colors.textSecondary }]}>
                        {count as number} ({Math.round(percentage)}%)
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.distributionBar,
                        { backgroundColor: theme.colors.border + '40' },
                      ]}
                    >
                      <View
                        style={[
                          styles.distributionFill,
                          { width: `${percentage}%`, backgroundColor: config.color },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={[styles.placeholderChart, { height: 80 }]}>
              <Icon name="pie-chart-outline" size={32} color={theme.colors.border} />
              <Text style={{ color: theme.colors.textSecondary, marginTop: 8 }}>
                Registra tus emociones para ver la distribución
              </Text>
            </View>
          )}
        </Card>

        {moodTrend.length > 1 && (
          <Card padding="lg" style={{ marginTop: 16 }}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Tendencia Semanal
            </Text>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
                <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
                  Ánimo
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#9C27B0' }]} />
                <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
                  Ansiedad
                </Text>
              </View>
            </View>
            <LineChart
              data={{
                labels: trendLabels,
                datasets: [
                  { data: moodScores, color: () => theme.colors.primary, strokeWidth: 2 },
                  { data: anxietyScores, color: () => '#9C27B0', strokeWidth: 2 },
                ],
                legend: [],
              }}
              width={width - 80}
              height={180}
              yAxisInterval={1}
              fromZero
              withInnerLines={false}
              chartConfig={{
                backgroundColor: theme.colors.card,
                backgroundGradientFrom: theme.colors.card,
                backgroundGradientTo: theme.colors.card,
                decimalPlaces: 0,
                color: () => theme.colors.primary,
                labelColor: () => theme.colors.textSecondary,
                propsForDots: { r: '4', strokeWidth: '1', stroke: theme.colors.primary },
              }}
              bezier
              style={{ borderRadius: 12, marginLeft: -20, marginTop: 12 }}
            />
          </Card>
        )}

        {moodHistory.length > 0 && (
          <Card padding="lg" style={{ marginTop: 16 }}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Registro Reciente
            </Text>
            <View style={{ marginTop: 12, gap: 10 }}>
              {moodHistory.slice(0, 5).map((entry) => {
                const date = new Date(entry.mood_date);
                const formattedDate = date.toLocaleDateString('es-CL', {
                  day: 'numeric',
                  month: 'short',
                });
                const tags = Array.isArray(entry.emotional_tags) ? entry.emotional_tags : [];
                return (
                  <View
                    key={entry.id}
                    style={[styles.historyRow, { borderBottomColor: theme.colors.border + '60' }]}
                  >
                    <Text style={[styles.historyDate, { color: theme.colors.textSecondary }]}>
                      {formattedDate}
                    </Text>
                    <View style={styles.historyScores}>
                      <View
                        style={[styles.scoreChip, { backgroundColor: theme.colors.primary + '15' }]}
                      >
                        <Text style={[styles.scoreChipText, { color: theme.colors.primary }]}>
                          {entry.mood_score || '—'}
                        </Text>
                      </View>
                      <View style={[styles.scoreChip, { backgroundColor: '#9C27B015' }]}>
                        <Text style={[styles.scoreChipText, { color: '#9C27B0' }]}>
                          {entry.anxiety_score || '—'}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.scoreChip,
                          { backgroundColor: theme.colors.secondary + '15' },
                        ]}
                      >
                        <Text style={[styles.scoreChipText, { color: theme.colors.secondary }]}>
                          {entry.energy_score || '—'}
                        </Text>
                      </View>
                    </View>
                    {tags.length > 0 && (
                      <View style={styles.tagRow}>
                        {tags.slice(0, 3).map((tag: string) => {
                          const category = Object.keys(EMOTION_CONFIG).find((k) => {
                            const mapping: Record<string, string[]> = {
                              happiness: [
                                'happy',
                                'content',
                                'joyful',
                                'satisfied',
                                'hopeful',
                                'motivated',
                                'calm',
                                'peaceful',
                                'relaxed',
                                'confident',
                                'grateful',
                                'proud',
                              ],
                              fear: [
                                'anxious',
                                'nervous',
                                'worried',
                                'overwhelmed',
                                'uncertain',
                                'restless',
                                'vulnerable',
                              ],
                              anger: [
                                'angry',
                                'frustrated',
                                'irritated',
                                'stressed',
                                'tense',
                                'annoyed',
                                'blocked',
                              ],
                              sadness: [
                                'sad',
                                'lonely',
                                'tired',
                                'empty',
                                'hopeless',
                                'melancholy',
                                'down',
                                'isolated',
                                'exhausted',
                              ],
                              surprise: ['surprised', 'curious', 'confused', 'amazed'],
                              disgust: ['disgust', 'disappointed', 'withdrawal'],
                            };
                            return mapping[k]?.includes(tag);
                          });
                          const conf = category ? EMOTION_CONFIG[category] : null;
                          return (
                            <View
                              key={tag}
                              style={[
                                styles.emotionTag,
                                {
                                  backgroundColor: conf
                                    ? conf.color + '15'
                                    : theme.colors.border + '30',
                                  borderColor: conf ? conf.color + '30' : theme.colors.border,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.emotionTagText,
                                  { color: conf?.color || theme.colors.textSecondary },
                                ]}
                              >
                                {TAG_TRANSLATIONS[tag] || tag.replace(/_/g, ' ')}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </Card>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  const renderHabitsTab = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text, marginBottom: 16 }]}>
        Consistencia de Hábitos
      </Text>
      {habitStats.length > 0 ? (
        habitStats.map((habit) => (
          <Card key={habit.id} padding="md" style={{ marginBottom: 12 }}>
            <View style={styles.habitRow}>
              <Text style={[styles.habitName, { color: theme.colors.text }]}>{habit.name}</Text>
              <Text style={[styles.habitPercent, { color: theme.colors.primary }]}>
                {Math.round(habit.completion_rate)}%
              </Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${habit.completion_rate}%`, backgroundColor: theme.colors.primary },
                ]}
              />
            </View>
          </Card>
        ))
      ) : (
        <Card padding="lg" style={{ alignItems: 'center' }}>
          <Text style={{ color: theme.colors.textSecondary }}>
            No hay hábitos registrados para este periodo.
          </Text>
        </Card>
      )}
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {renderHeader()}
      {renderTabs()}

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : activeTab === 'recovery' ? (
        renderRecoveryTab()
      ) : activeTab === 'emotions' ? (
        renderEmotionsTab()
      ) : (
        renderHabitsTab()
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    padding: 5,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
  },
  content: { flex: 1, padding: 20 },
  heroCard: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 20,
    alignItems: 'center',
  },
  heroLabel: { color: 'white', fontSize: 14, opacity: 0.9 },
  heroValue: { color: 'white', fontSize: 48, fontWeight: 'bold', marginVertical: 8 },
  heroFooter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroSubtext: { color: 'white', fontSize: 13, opacity: 0.8 },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statBox: { flex: 1, padding: 20, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 22, fontWeight: 'bold' },
  statLabel: { fontSize: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  placeholderChart: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  moodRow: { flexDirection: 'row', gap: 12, marginTop: 15 },
  moodItem: { flex: 1, alignItems: 'center', gap: 2 },
  moodValue: { fontSize: 24, fontWeight: 'bold' },
  moodLabel: { fontSize: 11, textAlign: 'center' },
  habitRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  habitName: { fontWeight: '500' },
  habitPercent: { fontWeight: 'bold' },
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topEmotionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
  },
  topEmotionLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  topEmotionName: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  emotionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  emotionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emotionLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  emotionCount: {
    fontSize: 12,
  },
  distributionBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  distributionFill: {
    height: '100%',
    borderRadius: 4,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
  },
  historyRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  historyDate: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyScores: {
    flexDirection: 'row',
    gap: 8,
  },
  scoreChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scoreChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  emotionTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  emotionTagText: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
});
