import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme/ThemeContext';
import Icon from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '@services/api';
import { ApiResponse } from '../../types/api';
import { Card } from '@components';

const { width } = Dimensions.get('window');

export const ProgressScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  
  const [stats, setStats] = useState<any>(null);
  const [habitStats, setHabitStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'recovery' | 'emotions' | 'habits'>('recovery');

  useEffect(() => {
    fetchAllStats();
  }, []);

  const fetchAllStats = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchHabitStats()]);
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const response = await api.get<ApiResponse<any>>('/checkins/stats?days=30');
      if (response && response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching progress stats:', error);
    }
  };

  const fetchHabitStats = async () => {
    try {
      const response = await api.get<ApiResponse<any[]>>('/journal/habits/stats?days=30');
      if (response && response.success) {
        setHabitStats(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching habit stats:', error);
    }
  };

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <TouchableOpacity 
        onPress={() => navigation.goBack()}
        style={[styles.backButton, { backgroundColor: theme.colors.surface + '20' }]}
      >
        <Icon name="chevron-back" size={24} color={theme.colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Mi Progreso</Text>
      <TouchableOpacity style={[styles.backButton, { backgroundColor: 'transparent' }]}>
        <Icon name="share-outline" size={24} color={theme.colors.text} />
      </TouchableOpacity>
    </View>
  );

  const renderTabs = () => (
    <View style={[styles.tabsContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      {(['recovery', 'emotions', 'habits'] as const).map((tab) => (
        <TouchableOpacity
          key={tab}
          onPress={() => setActiveTab(tab)}
          style={[
            styles.tab,
            activeTab === tab && { backgroundColor: theme.colors.primary }
          ]}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === tab ? 'white' : theme.colors.textSecondary }
          ]}>
            {tab === 'recovery' ? 'Recuperación' : tab === 'emotions' ? 'Emociones' : 'Hábitos'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderRecoveryStats = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Sobriety Card */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        start={[0, 0]}
        end={[1, 1]}
        style={styles.mainProgressCard}
      >
        <View style={styles.progressHeader}>
          <Icon name="ribbon-outline" size={40} color="white" />
          <View>
            <Text style={styles.progressLabel}>Días en Recuperación</Text>
            <Text style={styles.progressValue}>{stats?.totalCheckIns - stats?.riskSituations || 0}</Text>
          </View>
        </View>
        
        <View style={styles.progressFooter}>
          <Text style={styles.progressSubtext}>Has completado el {Math.round(((stats?.totalCheckIns || 0) / 30) * 100)}% de tus registros este mes.</Text>
          <View style={styles.progressBarBg}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${Math.min(100, ((stats?.totalCheckIns || 0) / 30) * 100)}%` }
              ]} 
            />
          </View>
        </View>
      </LinearGradient>

      {/* Grid Stats */}
      <View style={styles.statsGrid}>
        <Card variant="elevated" style={styles.statBox}>
          <Icon name="flame" size={24} color={theme.colors.warning} />
          <Text style={[styles.statBoxValue, { color: theme.colors.text }]}>{stats?.totalCheckIns || 0}</Text>
          <Text style={[styles.statBoxLabel, { color: theme.colors.textSecondary }]}>Total Registros</Text>
        </Card>
        
        <Card variant="elevated" style={styles.statBox}>
          <Icon name="fitness" size={24} color={theme.colors.secondary} />
          <Text style={[styles.statBoxValue, { color: theme.colors.text }]}>{stats?.exerciseDays || 0}</Text>
          <Text style={[styles.statBoxLabel, { color: theme.colors.textSecondary }]}>Días Activos</Text>
        </Card>
      </View>

      {/* Risk Situations */}
      <Card variant="outlined" style={styles.riskCard}>
        <View style={styles.riskHeader}>
          <View style={[styles.riskIcon, { backgroundColor: theme.colors.error + '20' }]}>
            <Icon name="warning" size={20} color={theme.colors.error} />
          </View>
          <Text style={[styles.riskTitle, { color: theme.colors.text }]}>Situaciones de Riesgo</Text>
        </View>
        <Text style={[styles.riskCount, { color: theme.colors.text }]}>{stats?.riskSituations || 0}</Text>
        <Text style={[styles.riskDesc, { color: theme.colors.textSecondary }]}>
          Identificar estos momentos es clave para tu crecimiento. ¡Sigue adelante!
        </Text>
      </Card>
    </ScrollView>
  );

  const renderEmotionsStats = () => {
    const emotionCategories = [
      { key: 'happiness', label: 'Felicidad', color: '#FFD580' },
      { key: 'surprise', label: 'Sorpresa', color: '#FFFACD' },
      { key: 'fear', label: 'Miedo', color: '#E0E0E0' },
      { key: 'anger', label: 'Ira', color: '#FFB2B2' },
      { key: 'disgust', label: 'Asco', color: '#D1FFD1' },
      { key: 'sadness', label: 'Tristeza', color: '#E6E6FA' },
    ];

    const distribution = stats?.emotionDistribution || {};
    const totalTags = Object.values(distribution).reduce((a: any, b: any) => a + b, 0) as number;

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Análisis de Estados de Ánimo</Text>
        
        <View style={styles.statsGrid}>
          <Card style={styles.statBox}>
            <Text style={[styles.statBoxValue, { color: theme.colors.text }]}>{stats?.averageMood?.toFixed(1) || '-'}</Text>
            <Text style={[styles.statBoxLabel, { color: theme.colors.textSecondary }]}>Ánimo Promedio</Text>
          </Card>
          <Card style={styles.statBox}>
            <Text style={[styles.statBoxValue, { color: theme.colors.text }]}>{stats?.averageAnxiety?.toFixed(1) || '-'}</Text>
            <Text style={[styles.statBoxLabel, { color: theme.colors.textSecondary }]}>Ansiedad Media</Text>
          </Card>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 24, marginBottom: 16 }]}>
          Distribución por Categorías
        </Text>

        <Card padding="lg" style={{ marginBottom: 24 }}>
          {emotionCategories.map((cat) => {
            const count = distribution[cat.key] || 0;
            const percentage = totalTags > 0 ? (count / totalTags) * 100 : 0;
            
            return (
              <View key={cat.key} style={{ marginBottom: 16 }}>
                <View style={styles.metricLabelRow}>
                  <Text style={[styles.metricLabel, { color: theme.colors.text }]}>{cat.label}</Text>
                  <Text style={[styles.metricValue, { color: theme.colors.text, opacity: 0.7 }]}>{count} registros</Text>
                </View>
                <View style={styles.barContainer}>
                  <View 
                    style={[
                      styles.barFill, 
                      { 
                        width: `${Math.max(percentage, totalTags === 0 ? 0 : 2)}%`, 
                        backgroundColor: cat.color 
                      }
                    ]} 
                  />
                </View>
              </View>
            );
          })}
          {totalTags === 0 && (
            <Text style={{ textAlign: 'center', color: theme.colors.textSecondary }}>
              No hay registros emocionales en este periodo.
            </Text>
          )}
        </Card>

        {/* Descanso */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Calidad del Descanso</Text>
        <Card variant="elevated" style={styles.sleepContainer}>
          <Icon name="moon" size={32} color={theme.colors.primary} />
          <Text style={[styles.sleepValue, { color: theme.colors.text }]}>{stats?.averageSleep?.toFixed(1) || '0'} hrs</Text>
          <Text style={[styles.sleepLabel, { color: theme.colors.textSecondary }]}>Promedio de sueño diario</Text>
        </Card>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  const renderHabitsStats = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Consistencia de Hábitos (30 días)</Text>
      
      {habitStats.length === 0 ? (
        <Card padding="lg" style={{ alignItems: 'center' }}>
          <Icon name="leaf-outline" size={48} color={theme.colors.textSecondary} />
          <Text style={{ color: theme.colors.textSecondary, marginTop: 12, textAlign: 'center' }}>
            Aún no has definido hábitos personalizados.{'\n'}Comienza en la sección de Bitácora.
          </Text>
        </Card>
      ) : (
        habitStats.map((habit) => (
          <Card key={habit.id} padding="md" style={{ marginBottom: 12 }}>
            <View style={styles.metricLabelRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[
                  styles.habitDot, 
                  { backgroundColor: habit.habit_type === 'negative' ? theme.colors.error : theme.colors.success }
                ]} />
                <Text style={[styles.metricLabel, { color: theme.colors.text, fontSize: 16 }]}>{habit.name}</Text>
              </View>
              <Text style={[
                styles.metricValue, 
                { color: habit.habit_type === 'negative' ? theme.colors.error : theme.colors.success }
              ]}>
                {Math.round(habit.completion_rate)}%
              </Text>
            </View>
            
            <View style={styles.barContainer}>
              <View style={[
                styles.barFill, 
                { 
                  width: `${habit.completion_rate}%`, 
                  backgroundColor: habit.habit_type === 'negative' ? theme.colors.error : theme.colors.success 
                }
              ]} />
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
                {habit.completion_count} de {habit.total_days} días
              </Text>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
                {habit.habit_type === 'negative' ? 'Hábito de Riesgo' : 'Hábito Saludable'}
              </Text>
            </View>
          </Card>
        ))
      )}

      {/* Insight Card */}
      <Card variant="filled" style={{ marginTop: 20, backgroundColor: theme.colors.primary + '10', marginBottom: 40 }}>
        <View style={{ flexDirection: 'row', padding: 16 }}>
          <Icon name="bulb-outline" size={24} color={theme.colors.primary} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: theme.colors.text, fontWeight: 'bold', fontSize: 15 }}>Tip de Recuperación</Text>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 13, marginTop: 4 }}>
              Mantener una consistencia superior al 70% en tus hábitos saludables reduce significativamente el riesgo de impulsos por consumo.
            </Text>
          </View>
        </View>
      </Card>
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {renderHeader()}
      {renderTabs()}
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={{ color: theme.colors.textSecondary }}>Cargando estadísticas...</Text>
        </View>
      ) : (
        <>
          {activeTab === 'recovery' && renderRecoveryStats()}
          {activeTab === 'emotions' && renderEmotionsStats()}
          {activeTab === 'habits' && renderHabitsStats()}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    padding: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  mainProgressCard: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  progressLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginLeft: 16,
  },
  progressValue: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  progressFooter: {
    marginTop: 8,
  },
  progressSubtext: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    marginBottom: 10,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: 'white',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  statBoxValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  statBoxLabel: {
    fontSize: 12,
  },
  riskCard: {
    padding: 20,
    marginBottom: 40,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  riskIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  riskTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  riskCount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  riskDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  metricRow: {
    marginBottom: 20,
  },
  metricLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  barContainer: {
    height: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  sleepContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  sleepValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 8,
  },
  sleepLabel: {
    fontSize: 14,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  comingSoonDesc: {
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 16,
    lineHeight: 22,
  },
  placeholderHabits: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 100,
  },
  habitDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  }
});
