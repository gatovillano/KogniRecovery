/**
 * CheckInScreen - Pantalla de check-in diario
 *
 * NOTA: Esta es una implementación placeholder.
 * Se implementará completamente en el sprint correspondiente.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions, FlatList, Modal, Alert } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabNavigationProp } from '@navigation/types';
import { useTheme } from '@theme/ThemeContext';
import { Button, Card, Slider, Input } from '@components';
import { checkinStore } from '@store/checkinStore';
import { useAuth } from '@hooks/useAuth';
import { api } from '@services/api';
import { ApiResponse } from '../../types/api';
import { JOURNAL_ENDPOINTS, CHECKIN_ENDPOINTS } from '@services/endpoints';
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

const { width } = Dimensions.get('window');

// Días de la semana
const DAYS_WEEK = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

// Emociones matizadas organizadas por categoría para el check-in diario
const EMOTIONAL_TAGS = [
  // === FELICIDAD ===
  { label: 'Feliz', emoji: '😊', value: 'happy', category: 'happiness' },
  { label: 'Alegre', emoji: '😄', value: 'joyful', category: 'happiness' },
  { label: 'Satisfecho', emoji: '😌', value: 'satisfied', category: 'happiness' },
  { label: 'Optimista', emoji: '🌟', value: 'optimistic', category: 'happiness' },
  { label: 'Motivado', emoji: '🔥', value: 'motivated', category: 'happiness' },
  { label: 'Orgulloso', emoji: '🏆', value: 'proud', category: 'happiness' },
  { label: 'Agradecido', emoji: '🙏', value: 'grateful', category: 'happiness' },
  { label: 'Amoroso', emoji: '❤️', value: 'loving', category: 'happiness' },
  { label: 'Calmado', emoji: '🧘', value: 'calm', category: 'happiness' },
  { label: 'Seguro', emoji: '🛡️', value: 'safe', category: 'happiness' },
  { label: 'Confiado', emoji: '💪', value: 'confident', category: 'happiness' },
  { label: 'Inspirado', emoji: '💡', value: 'inspired', category: 'happiness' },

  // === SORPRESA ===
  { label: 'Sorprendido', emoji: '😲', value: 'surprised', category: 'surprise' },
  { label: 'Asombrado', emoji: '😮', value: 'amazed', category: 'surprise' },
  { label: 'Confundido', emoji: '😕', value: 'confused', category: 'surprise' },
  { label: 'Curioso', emoji: '🤔', value: 'curious', category: 'surprise' },
  { label: 'Entusiasmado', emoji: '⚡', value: 'excited', category: 'surprise' },

  // === MIEDO ===
  { label: 'Miedo', emoji: '😨', value: 'fearful', category: 'fear' },
  { label: 'Ansioso', emoji: '😰', value: 'anxious', category: 'fear' },
  { label: 'Preocupado', emoji: '😟', value: 'worried', category: 'fear' },
  { label: 'Inseguro', emoji: '❓', value: 'insecure', category: 'fear' },
  { label: 'Vulnerable', emoji: '💔', value: 'vulnerable', category: 'fear' },
  { label: 'Agobiado', emoji: '😫', value: 'overwhelmed', category: 'fear' },
  { label: 'Espantado', emoji: '😱', value: 'frightened', category: 'fear' },

  // === IRA ===
  { label: 'Enojado', emoji: '😠', value: 'angry', category: 'anger' },
  { label: 'Frustrado', emoji: '😤', value: 'frustrated', category: 'anger' },
  { label: 'Irritado', emoji: '😒', value: 'irritated', category: 'anger' },
  { label: 'Molesto', emoji: '😡', value: 'annoyed', category: 'anger' },
  { label: 'Rabioso', emoji: '🤬', value: 'furious', category: 'anger' },
  { label: 'Resentido', emoji: '😾', value: 'resentful', category: 'anger' },
  { label: 'Estresado', emoji: '😫', value: 'stressed', category: 'anger' },
  { label: 'Tenso', emoji: '💪', value: 'tense', category: 'anger' },

  // === ASCO ===
  { label: 'Asco', emoji: '🤢', value: 'disgust', category: 'disgust' },
  { label: 'Decepcionado', emoji: '😞', value: 'disappointed', category: 'disgust' },
  { label: 'Horrible', emoji: '🤮', value: 'awful', category: 'disgust' },
  { label: 'Abstinencia', emoji: '💊', value: 'withdrawal', category: 'disgust' },
  { label: 'Desconforme', emoji: '🫤', value: 'disapproving', category: 'disgust' },

  // === TRISTEZA ===
  { label: 'Triste', emoji: '😢', value: 'sad', category: 'sadness' },
  { label: 'Solo', emoji: '😔', value: 'lonely', category: 'sadness' },
  { label: 'Deprimido', emoji: '😞', value: 'depressed', category: 'sadness' },
  { label: 'Culpable', emoji: '😔', value: 'guilty', category: 'sadness' },
  { label: 'Abatido', emoji: '😞', value: 'dejected', category: 'sadness' },
  { label: 'Desesperanzado', emoji: '😩', value: 'hopeless', category: 'sadness' },
  { label: 'Cansado', emoji: '😴', value: 'tired', category: 'sadness' },
  { label: 'Agotado', emoji: '😩', value: 'exhausted', category: 'sadness' },
];

// Categorías para filtrar emociones
const EMOTION_CATEGORIES = [
  { key: 'all', label: 'Todas', color: '#007AFF' },
  { key: 'happiness', label: 'Felicidad', color: '#FFD580' },
  { key: 'surprise', label: 'Sorpresa', color: '#FFFACD' },
  { key: 'fear', label: 'Miedo', color: '#E0E0E0' },
  { key: 'anger', label: 'Ira', color: '#FFB2B2' },
  { key: 'disgust', label: 'Asco', color: '#D1FFD1' },
  { key: 'sadness', label: 'Tristeza', color: '#E6E6FA' },
];

export const CheckInScreen: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<MainTabNavigationProp>();
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<'calendar' | 'form' | 'notes' | 'activity' | 'analysis' | 'social' | 'habits'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [dayData, setDayData] = useState<any>(null);
  const [monthCheckIns, setMonthCheckIns] = useState<string[]>([]); // Array de fechas YYYY-MM-DD
  const [stats, setStats] = useState<any>(null);
  const [loadingDay, setLoadingDay] = useState(false);
  const [feedData, setFeedData] = useState<FeedEntry[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Form State
  const [mood, setMood] = useState(5);
  const [anxiety, setAnxiety] = useState(3);
  const [energy, setEnergy] = useState(7);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sleepHours, setSleepHours] = useState('8');
  const [exercised, setExercised] = useState(false);
  const [consumed, setConsumed] = useState(false);
  const [consumedAmount, setConsumedAmount] = useState('');
  const [notes, setNotes] = useState('');

  // Nuevos flujos State
  const [freeNotes, setFreeNotes] = useState('');
  const [activityName, setActivityName] = useState('');
  const [feelingBefore, setFeelingBefore] = useState('');
  const [feelingDuring, setFeelingDuring] = useState('');
  const [feelingAfter, setFeelingAfter] = useState('');
  const [analysisSituation, setAnalysisSituation] = useState('');
  const [analysisAction, setAnalysisAction] = useState('');
  const [socialPeople, setSocialPeople] = useState('');
  const [socialImpact, setSocialImpact] = useState('');
  const [habitGood, setHabitGood] = useState('');
  const [habitBad, setHabitBad] = useState('');
  const [habitsConfig, setHabitsConfig] = useState<any[]>([]); // Lista de hábitos definidos
  const [loadingHabits, setLoadingHabits] = useState(false);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitType, setNewHabitType] = useState<'positive' | 'negative'>('positive');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<FeedEntry['type'] | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const totalSteps = 5;

  const getLocalDateString = (date: Date | null) => {
    const d = date || new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const resetForm = () => {
    setEditingId(null);
    setEditingType(null);
    setMood(5);
    setAnxiety(3);
    setEnergy(7);
    setSelectedTags([]);
    setSleepHours('8');
    setExercised(false);
    setConsumed(false);
    setConsumedAmount('');
    setNotes('');
    setFreeNotes('');
    setActivityName('');
    setFeelingBefore('');
    setFeelingDuring('');
    setFeelingAfter('');
    setAnalysisSituation('');
    setAnalysisAction('');
    setSocialPeople('');
    setSocialImpact('');
    setHabitGood('');
    setHabitBad('');
    setStep(0);
    setCompleted(false);
  };

  const renderDatePickerModal = () => {
    const days = generateMonthDays(currentMonth);
    const monthName = currentMonth.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });

    return (
      <Modal visible={showDatePicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card, width: '90%', paddingBottom: 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Seleccionar Fecha</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Icon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={[styles.calendarHeader, { marginBottom: 10 }]}>
              <Text style={[styles.monthTitle, { color: theme.colors.text, fontSize: 18 }]}>
                {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
              </Text>
              <View style={styles.headerControls}>
                <TouchableOpacity onPress={() => handleMonthChange(-1)}>
                  <Icon name="chevron-back" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleMonthChange(1)}>
                  <Icon name="chevron-forward" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.daysWeekRow, { marginBottom: 5 }]}>
              {DAYS_WEEK.map((d, i) => (
                <Text key={i} style={[styles.dayWeekText, { color: theme.colors.textSecondary, width: 40 }]}>{d}</Text>
              ))}
            </View>

            <View style={[styles.daysGrid, { justifyContent: 'flex-start' }]}>
              {days.map((d, i) => {
                if (!d) return <View key={`empty-${i}`} style={{ width: (width * 0.9 - 60) / 7, height: 40, margin: 2 }} />;
                const isSelected = selectedDate && d.toDateString() === selectedDate.toDateString();
                const isToday = d.toDateString() === new Date().toDateString();
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      { width: (width * 0.9 - 60) / 7, height: 40, justifyContent: 'center', alignItems: 'center', margin: 2 },
                      isSelected && { backgroundColor: theme.colors.primary, borderRadius: 10 }
                    ]}
                    onPress={() => {
                      setSelectedDate(d);
                      setShowDatePicker(false);
                    }}
                  >
                    <Text style={[
                      { color: isSelected ? 'white' : theme.colors.text },
                      isToday && !isSelected && { color: theme.colors.primary, fontWeight: 'bold' }
                    ]}>
                      {d.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderDateSelector = () => (
    <View style={[styles.dateSelectorContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <Icon name="calendar-outline" size={20} color={theme.colors.primary} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ color: theme.colors.textSecondary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Fecha del registro</Text>
        <Text style={{ color: theme.colors.text, fontSize: 15, fontWeight: '600' }}>
          {selectedDate?.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>
      </View>
      <TouchableOpacity 
        style={[styles.miniEditBtn, { backgroundColor: theme.colors.primary + '15' }]}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: 'bold' }}>Cambiar</Text>
      </TouchableOpacity>
    </View>
  );

  useEffect(() => {
    fetchGeneralStats();
    fetchMonthCheckIns(currentMonth);
    fetchFeed();
    fetchHabitsStatus();
  }, [currentMonth]);

  const fetchGeneralStats = async () => {
    try {
      const response = await api.get<ApiResponse<any>>('/checkins/stats');
      if (response && response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching general stats:', error);
    }
  };

  const fetchMonthCheckIns = async (date: Date) => {
    try {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const start = `${year}-${month.toString().padStart(2, '0')}-01`;
      const end = `${year}-${month.toString().padStart(2, '0')}-31`; // Simplificado para la consulta

      const response = await api.get<ApiResponse<any>>(`/checkins/range?start_date=${start}&end_date=${end}`);
      if (response && response.success) {
        const dates = (response.data as any[]).map(c => c.checkin_date.split('T')[0]);
        setMonthCheckIns(dates);
      }
    } catch (error) {
      console.error('Error fetching month checks:', error);
    }
  };

  const fetchDayData = async (date: Date) => {
    setLoadingDay(true);
    try {
      const dateStr = getLocalDateString(date);
      const response = await api.get<ApiResponse<any>>(`/checkins/today?date=${dateStr}`);
      if (response && response.success) {
        setDayData(response.data);
      } else {
        setDayData(null);
      }
    } catch (error) {
      setDayData(null);
    } finally {
      setLoadingDay(false);
    }
  };

  const fetchFeed = async () => {
    setLoadingFeed(true);
    try {
      const response = await api.get<ApiResponse<FeedEntry[]>>(JOURNAL_ENDPOINTS.FEED, { limit: 50 });
      if (response && response.success) {
        setFeedData(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setLoadingFeed(false);
    }
  };

  const fetchHabitsStatus = async (date?: Date) => {
    setLoadingHabits(true);
    try {
      const targetDate = getLocalDateString(date || selectedDate);
      const response = await api.get<ApiResponse<any[]>>(`${JOURNAL_ENDPOINTS.HABITS_STATUS}?date=${targetDate}`);
      if (response && response.success) {
        setHabitsConfig(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching habits:', error);
    } finally {
      setLoadingHabits(false);
    }
  };

  const toggleHabit = async (habitId: string) => {
    try {
      const targetDate = getLocalDateString(selectedDate);
      const response = await api.post<ApiResponse<any>>(JOURNAL_ENDPOINTS.HABIT_TOGGLE, {
        habit_id: habitId,
        date: targetDate
      });
      if (response && response.success) {
        // Optimistic update locally
        setHabitsConfig(prev => prev.map(h => 
          h.id === habitId ? { ...h, is_completed: !h.is_completed } : h
        ));
      }
    } catch (error) {
      console.error('Error toggling habit:', error);
    }
  };

  const addHabitDefinition = async () => {
    if (!newHabitName.trim()) return;
    try {
      const response = await api.post<ApiResponse<any>>(JOURNAL_ENDPOINTS.HABIT_DEFINITION, {
        name: newHabitName,
        frequency: 'daily',
        habit_type: newHabitType
      });
      if (response && response.success) {
        setNewHabitName('');
        setNewHabitType('positive');
        setShowAddHabit(false);
        fetchHabitsStatus();
      }
    } catch (error) {
      console.error('Error adding habit definition:', error);
    }
  };

  const deleteHabitDefinition = async (habitId: string) => {
    try {
      const response = await api.delete<ApiResponse<any>>(JOURNAL_ENDPOINTS.HABIT_DEFINITION_ID(habitId));
      if (response && response.success) {
        fetchHabitsStatus();
      }
    } catch (error) {
      console.error('Error deleting habit:', error);
    }
  };

  const handleMonthChange = (offset: number) => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1);
    setCurrentMonth(newMonth);
    fetchMonthCheckIns(newMonth);
    // No reseteamos selectedDate para permitir navegar meses manteniendo la fecha si se desea, 
    // pero limpiamos dayData para que se recargue si el usuario vuelve a ver el día.
    setDayData(null);
  };

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t: string) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      submitCheckIn();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      setViewMode('calendar');
    }
  };

  const submitCheckIn = async () => {
    setLoading(true);
    try {
      const targetDate = getLocalDateString(selectedDate);
      let response: ApiResponse<any> | null = null;

      if (viewMode === 'form') {
        // --- Diario de Observación ---
        const payload = {
          checkin_date: targetDate,
          mood_score: mood,
          anxiety_score: anxiety,
          energy_score: energy,
          emotional_tags: selectedTags,
          sleep_hours: parseFloat(sleepHours) || 0,
          exercised_today: exercised,
          consumed_substances: consumed ? [{ name: 'Sustancia', quantity: consumedAmount }] : [],
          risk_situation: consumed,
          notes: notes,
          checkin_type: 'diario'
        };
        
        if (editingId && editingType === 'checkin') {
          response = await api.put<ApiResponse<any>>(`/checkins/${editingId}`, payload);
        } else {
          response = await api.post<ApiResponse<any>>('/checkins', payload);
        }

      } else if (viewMode === 'notes') {
        // --- Nota Libre ---
        const payload = {
          content: freeNotes,
          note_date: targetDate,
        };
        if (editingId && editingType === 'note') {
          response = await api.patch<ApiResponse<any>>(`/journal/notes/${editingId}`, payload);
        } else {
          response = await api.post<ApiResponse<any>>('/journal/notes', payload);
        }

      } else if (viewMode === 'activity') {
        // --- Registro de Actividad ---
        const payload = {
          activity_name: activityName,
          feeling_before: feelingBefore,
          feeling_during: feelingDuring,
          feeling_after: feelingAfter,
          entry_date: targetDate,
        };
        if (editingId && editingType === 'activity') {
          response = await api.patch<ApiResponse<any>>(`/journal/activities/${editingId}`, payload);
        } else {
          response = await api.post<ApiResponse<any>>('/journal/activities', payload);
        }

      } else if (viewMode === 'social') {
        // --- Entorno Social ---
        const payload = {
          people_description: socialPeople,
          impact_assessment: socialImpact,
          entry_date: targetDate,
        };
        if (editingId && editingType === 'social') {
          response = await api.patch<ApiResponse<any>>(`/journal/social/${editingId}`, payload);
        } else {
          response = await api.post<ApiResponse<any>>('/journal/social', payload);
        }

      } else if (viewMode === 'habits') {
        // --- Hábitos ---
        const payload = {
          protective_habits: habitGood,
          risk_habits: habitBad,
          entry_date: targetDate,
        };
        if (editingId && editingType === 'habit') {
          response = await api.patch<ApiResponse<any>>(`/journal/habits/${editingId}`, payload);
        } else {
          response = await api.post<ApiResponse<any>>('/journal/habits', payload);
        }

      } else if (viewMode === 'analysis') {
        // --- Análisis de Consumo ---
        const payload = {
          trigger_situation: analysisSituation,
          action_taken: analysisAction,
          entry_date: targetDate,
        };
        if (editingId && editingType === 'analysis') {
          response = await api.patch<ApiResponse<any>>(`/journal/analysis/${editingId}`, payload);
        } else {
          response = await api.post<ApiResponse<any>>('/journal/analysis', payload);
        }
      }

      if (response && response.success) {
        setCompleted(true);
        if (viewMode === 'form') {
          fetchGeneralStats();
          fetchMonthCheckIns(currentMonth);
        }
        // Refresh feed after any type of entry
        fetchFeed();
        if (selectedDate) fetchDayData(selectedDate);
      }
    } catch (error) {
      console.error('Error submitting check-in:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = (entry: FeedEntry) => {
    Alert.alert(
      'Eliminar registro',
      '¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              let url = '';
              switch (entry.type) {
                case 'checkin': url = `/checkins/${entry.id}`; break;
                case 'note': url = `/journal/notes/${entry.id}`; break;
                case 'habit': url = `/journal/habits/${entry.id}`; break;
                case 'social': url = `/journal/social/${entry.id}`; break;
                case 'activity': url = `/journal/activities/${entry.id}`; break;
                case 'analysis': url = `/journal/analysis/${entry.id}`; break;
              }
              
              if (url) {
                const response = await api.delete<ApiResponse<any>>(url);
                if (response && response.success) {
                  fetchFeed();
                  if (selectedDate) fetchDayData(selectedDate);
                  fetchGeneralStats();
                }
              }
            } catch (error) {
              console.error('Error deleting entry:', error);
              Alert.alert('Error', 'No se pudo eliminar el registro.');
            }
          }
        }
      ]
    );
  };

  // Helper para generar días del mes
  const generateMonthDays = (baseDate: Date) => {
    const days: (Date | null)[] = [];
    const firstDay = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
    const lastDay = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0).getDate();

    // Rellenamos con nulos los días previos al primer día del mes para alinear la grilla
    const firstDayOfWeek = firstDay.getDay(); // 0 = Domingo, 1 = Lunes...
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    for (let i = 1; i <= lastDay; i++) {
      days.push(new Date(baseDate.getFullYear(), baseDate.getMonth(), i));
    }
    return days;
  };

  // Renderizar una entrada del feed con detalles completos
  const renderFeedItem = (entry: FeedEntry) => {
    const config = FEED_TYPE_CONFIG[entry.type] || { label: 'Registro', icon: 'document-outline', color: '#8E8E93' };
    const entryDate = new Date(entry.entry_date + 'T12:00:00');
    const formattedDate = entryDate.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });

    // Renderizar contenido según el tipo de entrada
    const renderContent = () => {
      switch (entry.type) {
        case 'checkin':
          return (
            <View style={styles.feedCardContent}>
              <View style={styles.detailRow}>
                <Icon name="happy-outline" size={20} color={theme.colors.primary} />
                <Text style={{ color: theme.colors.text }}>Ánimo: {entry.data.mood_score || '-'}/10</Text>
              </View>
              <View style={styles.detailRow}>
                <Icon name="flash-outline" size={20} color="#FF9500" />
                <Text style={{ color: theme.colors.text }}>Energía: {entry.data.energy_score || '-'}/10</Text>
              </View>
              <View style={styles.detailRow}>
                <Icon name="shield-checkmark-outline" size={20} color={theme.colors.success} />
                <Text style={{ color: theme.colors.text }}>
                  {entry.data.consumed ? (
                    <Text style={{ color: theme.colors.error }}>Recaída registrada</Text>
                  ) : 'Día libre de consumo'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Icon name="bed-outline" size={20} color={theme.colors.textSecondary} />
                <Text style={{ color: theme.colors.text }}>Sueño: {entry.data.sleep_hours || '-'} horas</Text>
              </View>
              {entry.data.emotional_tags && entry.data.emotional_tags.length > 0 && (
                <View style={{ marginTop: 8 }}>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginBottom: 4 }}>Etiquetas:</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {entry.data.emotional_tags.map((tag: string, idx: number) => (
                      <View key={idx} style={{ backgroundColor: theme.colors.primary + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                        <Text style={{ color: theme.colors.primary, fontSize: 12 }}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              {entry.data.notes && (
                <View style={{ marginTop: 10 }}>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 13, marginBottom: 4 }}>Notas:</Text>
                  <Text style={[styles.detailNotes, { color: theme.colors.textSecondary }]}>{entry.data.notes}</Text>
                </View>
              )}
            </View>
          );
        case 'note':
          return (
            <View style={styles.feedCardContent}>
              <Text style={[styles.feedNoteText, { color: theme.colors.text }]}>
                {entry.data.content || 'Sin contenido'}
              </Text>
            </View>
          );
        case 'habit':
          return (
            <View style={styles.feedCardContent}>
              {entry.data.protective_habits && (
                <View style={styles.habitSection}>
                  <View style={styles.detailRow}>
                    <Icon name="leaf-outline" size={20} color={theme.colors.success} />
                    <Text style={[styles.habitTitle, { color: theme.colors.success }]}>Hábitos Protectores</Text>
                  </View>
                  <Text style={[styles.habitText, { color: theme.colors.text }]}>
                    {entry.data.protective_habits}
                  </Text>
                </View>
              )}
              {entry.data.risk_habits && (
                <View style={[styles.habitSection, { marginTop: 12 }]}>
                  <View style={styles.detailRow}>
                    <Icon name="warning-outline" size={20} color={theme.colors.error} />
                    <Text style={[styles.habitTitle, { color: theme.colors.error }]}>Hábitos de Riesgo</Text>
                  </View>
                  <Text style={[styles.habitText, { color: theme.colors.text }]}>
                    {entry.data.risk_habits}
                  </Text>
                </View>
              )}
            </View>
          );
        case 'social':
          return (
            <View style={styles.feedCardContent}>
              <View style={styles.detailRow}>
                <Icon name="people-outline" size={20} color={theme.colors.primary} />
                <Text style={{ color: theme.colors.text }}>Personas</Text>
              </View>
              <Text style={[styles.socialText, { color: theme.colors.text }]}>
                {entry.data.people_description || 'Sin descripción'}
              </Text>
              {entry.data.impact_assessment && (
                <View style={{ marginTop: 10 }}>
                  <View style={styles.detailRow}>
                    <Icon name="analytics-outline" size={20} color="#FF9500" />
                    <Text style={{ color: theme.colors.text }}>Evaluación de Impacto</Text>
                  </View>
                  <Text style={[styles.socialText, { color: theme.colors.text }]}>
                    {entry.data.impact_assessment}
                  </Text>
                </View>
              )}
            </View>
          );
        case 'activity':
          return (
            <View style={styles.feedCardContent}>
              <View style={styles.detailRow}>
                <Icon name="fitness-outline" size={20} color="#FF9500" />
                <Text style={[styles.activityName, { color: theme.colors.text }]}>
                  {entry.data.activity_name || 'Actividad'}
                </Text>
              </View>
              {entry.data.feeling_before && (
                <View style={styles.feelingSection}>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>ANTES</Text>
                  <Text style={[styles.feelingText, { color: theme.colors.text }]}>
                    {entry.data.feeling_before}
                  </Text>
                </View>
              )}
              {entry.data.feeling_during && (
                <View style={styles.feelingSection}>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>DURANTE</Text>
                  <Text style={[styles.feelingText, { color: theme.colors.text }]}>
                    {entry.data.feeling_during}
                  </Text>
                </View>
              )}
              {entry.data.feeling_after && (
                <View style={styles.feelingSection}>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>DESPUÉS</Text>
                  <Text style={[styles.feelingText, { color: theme.colors.text }]}>
                    {entry.data.feeling_after}
                  </Text>
                </View>
              )}
            </View>
          );
        case 'analysis':
          return (
            <View style={styles.feedCardContent}>
              <View style={styles.detailRow}>
                <Icon name="shield-half-outline" size={20} color={theme.colors.error} />
                <Text style={{ color: theme.colors.text }}>Análisis de Consumo</Text>
              </View>
              {entry.data.trigger_situation && (
                <View style={styles.feelingSection}>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>SITUACIÓN DETONANTE</Text>
                  <Text style={[styles.feelingText, { color: theme.colors.text }]}>
                    {entry.data.trigger_situation}
                  </Text>
                </View>
              )}
              {entry.data.action_taken && (
                <View style={styles.feelingSection}>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>ACCIÓN TOMADA</Text>
                  <Text style={[styles.feelingText, { color: theme.colors.text }]}>
                    {entry.data.action_taken}
                  </Text>
                </View>
              )}
            </View>
          );
        case 'habit_completion':
          return (
            <View style={styles.feedCardContent}>
              <View style={styles.detailRow}>
                <Icon 
                  name={entry.data.habit_type === 'negative' ? 'trending-down' : 'trending-up'} 
                  size={20} 
                  color={entry.data.habit_type === 'negative' ? theme.colors.error : theme.colors.success} 
                />
                <Text style={{ color: theme.colors.text, fontWeight: 'bold' }}>
                  {entry.data.habit_name}
                </Text>
              </View>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
                {entry.data.habit_type === 'negative' ? 'Hábito de riesgo registrado' : 'Hábito saludable realizado'}
              </Text>
            </View>
          );
        default:
          return (
            <View style={styles.feedCardContent}>
              <Text style={{ color: theme.colors.text }}>Registro del día</Text>
            </View>
          );
      }
    };

    return (
      <View
        key={entry.id}
        style={[styles.feedDetailCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
      >
        <View style={styles.feedDetailHeader}>
          <View style={[styles.feedDetailIconContainer, { backgroundColor: config.color + '20' }]}>
            <Icon name={config.icon as any} size={22} color={config.color} />
          </View>
          <View style={styles.feedDetailTitleContainer}>
            <Text style={[styles.feedDetailType, { color: config.color }]}>{config.label}</Text>
            <Text style={[styles.feedDetailDate, { color: theme.colors.textSecondary }]}>{formattedDate}</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              // Ajustar la fecha para que se interprete localmente sin desfase UTC
              const entryDate = new Date(entry.entry_date + 'T12:00:00');
              setSelectedDate(entryDate);
              setEditingId(entry.id);
              setEditingType(entry.type);
              
              if (entry.type === 'checkin') {
                setMood(entry.data.mood_score || 5);
                setAnxiety(entry.data.anxiety_score || 3);
                setEnergy(entry.data.energy_score || 7);
                setSelectedTags(entry.data.emotional_tags || []);
                setSleepHours(String(entry.data.sleep_hours || 8));
                setExercised(entry.data.exercised || false);
                setConsumed(entry.data.consumed || false);
                setConsumedAmount(entry.data.consumed_substances?.[0]?.quantity || '');
                setNotes(entry.data.notes || '');
                setStep(0);
                setViewMode('form');
              } else if (entry.type === 'note') {
                setFreeNotes(entry.data.content || '');
                setViewMode('notes');
              } else if (entry.type === 'habit') {
                setHabitGood(entry.data.protective_habits || '');
                setHabitBad(entry.data.risk_habits || '');
                setViewMode('habits');
              } else if (entry.type === 'social') {
                setSocialPeople(entry.data.people_description || '');
                setSocialImpact(entry.data.impact_assessment || '');
                setViewMode('social');
              } else if (entry.type === 'activity') {
                setActivityName(entry.data.activity_name || '');
                setFeelingBefore(entry.data.feeling_before || '');
                setFeelingDuring(entry.data.feeling_during || '');
                setFeelingAfter(entry.data.feeling_after || '');
                setViewMode('activity');
              } else if (entry.type === 'analysis') {
                setAnalysisSituation(entry.data.trigger_situation || '');
                setAnalysisAction(entry.data.action_taken || '');
                setViewMode('analysis');
              } else if (entry.type === 'habit_completion') {
                // Para hábitos completados, llevamos a la vista de checklist de ese día
                setViewMode('habits');
                fetchHabitsStatus(entryDate);
              }
            }}
            style={[styles.editButton, { backgroundColor: theme.colors.primary + '20' }]}
          >
            <Icon name="create-outline" size={18} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteEntry(entry)}
            style={[styles.deleteButton, { backgroundColor: theme.colors.error + '20', marginLeft: 8 }]}
          >
            <Icon name="trash-outline" size={18} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
        {renderContent()}
      </View>
    );
  };

  // Renderizar el feed del día
  const renderDailyFeed = () => {
    if (loadingFeed) {
      return (
        <View style={styles.feedLoading}>
          <Text style={{ color: theme.colors.textSecondary }}>Cargando registros...</Text>
        </View>
      );
    }

    if (feedData.length === 0) {
      return (
        <View style={styles.feedEmpty}>
          <Icon name="journal-outline" size={40} color={theme.colors.textSecondary} />
          <Text style={[styles.feedEmptyText, { color: theme.colors.textSecondary }]}>
            No hay registros todavía.{'\\n'}¡Comienza a escribir tu bitácora!
          </Text>
        </View>
      );
    }

    // Filtrar entradas del día seleccionado (si hay una fecha seleccionada)
    const filteredFeed = selectedDate
      ? feedData.filter(entry => entry.entry_date === getLocalDateString(selectedDate))
      : feedData.slice(0, 10); // Mostrar últimos 10 si no hay fecha seleccionada

    if (filteredFeed.length === 0) {
      return (
        <View style={styles.feedEmpty}>
          <Text style={[styles.feedEmptyText, { color: theme.colors.textSecondary }]}>
            No hay registros para este día.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.feedContainer}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {selectedDate ? `Registros del ${selectedDate.toLocaleDateString('es-CL')}` : 'Registros Recientes'}
        </Text>
        {filteredFeed.map(renderFeedItem)}
      </View>
    );
  };

  const renderCalendar = () => {
    const days = generateMonthDays(currentMonth);
    const monthName = currentMonth.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });

    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: Math.max(insets.top, 16) }}>
        <ScrollView contentContainerStyle={[styles.calendarContainer, { paddingBottom: insets.bottom + 100 }]}>
          <View style={styles.calendarHeader}>
            <Text style={[styles.monthTitle, { color: theme.colors.text }]}>
              {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
            </Text>
            <View style={styles.headerControls}>
              <TouchableOpacity onPress={() => handleMonthChange(-1)}>
                <Icon name="chevron-back" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleMonthChange(1)}>
                <Icon name="chevron-forward" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.daysWeekRow}>
            {DAYS_WEEK.map((d, i) => (
              <Text key={i} style={[styles.dayWeekText, { color: theme.colors.textSecondary }]}>{d}</Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {days.map((d, i) => {
              if (!d) {
                return <View key={`empty-${i}`} style={styles.dayCell} />;
              }

              const dateStr = getLocalDateString(d);
              const isToday = d.toDateString() === new Date().toDateString();
              const isSelected = selectedDate && d.toDateString() === selectedDate.toDateString();
              const hasCheckIn = monthCheckIns.includes(dateStr);

              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.dayCell,
                    isSelected && { backgroundColor: theme.colors.primary, borderRadius: 10 }
                  ]}
                  onPress={() => {
                    if (isSelected) {
                      setSelectedDate(null);
                      setDayData(null);
                    } else {
                      setSelectedDate(d);
                      fetchDayData(d);
                    }
                  }}
                >
                  <Text style={[
                    styles.dayText,
                    { color: isSelected ? 'white' : theme.colors.text },
                    isToday && !isSelected && { color: theme.colors.primary, fontWeight: 'bold' }
                  ]}>
                    {d.getDate()}
                  </Text>
                  {hasCheckIn && (
                    <View style={[
                      styles.dotIndicator,
                      { backgroundColor: isSelected ? 'white' : theme.colors.primary }
                    ]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ marginTop: 20 }}>
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text, marginBottom: 0 }]}>Tu Progreso General</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Progress' as any)}>
                  <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Ver detalles</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.statsGrid}>
                <Card variant="outlined" style={styles.statCard}>
                  <Icon name="flame" size={28} color="#FF9500" />
                  <Text style={styles.statValue}>{stats?.totalCheckIns || 0}</Text>
                  <Text style={styles.statLabel}>Registros</Text>
                </Card>

                <Card variant="outlined" style={styles.statCard}>
                  <Icon name="heart" size={28} color="#FF2D55" />
                  <Text style={styles.statValue}>{stats?.averageMood?.toFixed(1) || '-'}</Text>
                  <Text style={styles.statLabel}>Ánimo Promedio</Text>
                </Card>
              </View>

              <Card variant="outlined" padding="md" style={{ marginTop: 16 }}>
                <Text style={[styles.subTitle, { color: theme.colors.text }]}>Días Sobrio</Text>
                <View style={styles.sobrietyRow}>
                  <Icon name="ribbon" size={40} color={theme.colors.success} />
                  <View>
                    <Text style={[styles.sobrietyValue, { color: theme.colors.text }]}>
                      {stats?.totalCheckIns - stats?.riskSituations || 0} Días
                    </Text>
                    <Text style={{ color: theme.colors.textSecondary }}>Fiel a tu proceso y recuperando tu vida.</Text>
                  </View>
                </View>
              </Card>
            </View>
          </View >

          {/* Feed de Registros del Día */}
          {renderDailyFeed()}
        </ScrollView >

        {/* Floating Action Button */}
        < TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={() => {
            if (!selectedDate) setSelectedDate(new Date());
            resetForm();
            setShowOptionsModal(true);
          }}
        >
          <Icon name="add" size={32} color="white" />
        </TouchableOpacity >

        {/* Options Modal */}
        < Modal
          visible={showOptionsModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowOptionsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Nueva Entrada</Text>
                <TouchableOpacity onPress={() => setShowOptionsModal(false)}>
                  <Icon name="close" size={24} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
                ¿Qué tipo de registro deseas añadir a tu bitácora hoy?
              </Text>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '80%' }} contentContainerStyle={{ paddingBottom: 20 }}>

              <TouchableOpacity
                style={[styles.optionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                onPress={() => {
                  setShowOptionsModal(false);
                  resetForm();
                  setViewMode('form');
                }}
              >
                <View style={[styles.optionIconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
                  <Icon name="journal-outline" size={24} color={theme.colors.primary} />
                </View>
                <View style={styles.optionTexts}>
                  <Text style={[styles.optionTitle, { color: theme.colors.text }]}>Diario de Observación</Text>
                  <Text style={[styles.optionDesc, { color: theme.colors.textSecondary }]} numberOfLines={1}>Evaluación general de tu día (ánimo, energía, ansiedad).</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.optionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                onPress={() => {
                  setShowOptionsModal(false);
                  resetForm();
                  setViewMode('notes');
                }}
              >
                <View style={[styles.optionIconContainer, { backgroundColor: theme.colors.success + '20' }]}>
                  <Icon name="create-outline" size={24} color={theme.colors.success} />
                </View>
                <View style={styles.optionTexts}>
                  <Text style={[styles.optionTitle, { color: theme.colors.text }]}>Notas Libres</Text>
                  <Text style={[styles.optionDesc, { color: theme.colors.textSecondary }]} numberOfLines={1}>Escribe libremente tus pensamientos, un párrafo o una carta.</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.optionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                onPress={() => {
                  setShowOptionsModal(false);
                  resetForm();
                  setViewMode('activity');
                }}
              >
                <View style={[styles.optionIconContainer, { backgroundColor: '#FF9500' + '20' }]}>
                  <Icon name="analytics-outline" size={24} color="#FF9500" />
                </View>
                <View style={styles.optionTexts}>
                  <Text style={[styles.optionTitle, { color: theme.colors.text }]}>Registro de Actividad</Text>
                  <Text style={[styles.optionDesc, { color: theme.colors.textSecondary }]} numberOfLines={1}>Evalúa cómo te sentiste antes, durante y después de una actividad.</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.optionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                onPress={() => {
                  setShowOptionsModal(false);
                  resetForm();
                  setViewMode('analysis');
                }}
              >
                <View style={[styles.optionIconContainer, { backgroundColor: theme.colors.error + '20' }]}>
                  <Icon name="shield-half-outline" size={24} color={theme.colors.error} />
                </View>
                <View style={styles.optionTexts}>
                  <Text style={[styles.optionTitle, { color: theme.colors.text }]}>Análisis de Consumo</Text>
                  <Text style={[styles.optionDesc, { color: theme.colors.textSecondary }]} numberOfLines={1}>¿Qué hago cuando consumo y cuando no? Reflexión para prevenir.</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.optionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                onPress={() => {
                  setShowOptionsModal(false);
                  resetForm();
                  setViewMode('social');
                }}
              >
                <View style={[styles.optionIconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
                  <Icon name="people-outline" size={24} color={theme.colors.primary} />
                </View>
                <View style={styles.optionTexts}>
                  <Text style={[styles.optionTitle, { color: theme.colors.text }]}>Entorno Social</Text>
                  <Text style={[styles.optionDesc, { color: theme.colors.textSecondary }]} numberOfLines={1}>Identifica a tu red de apoyo y los contactos de riesgo.</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.optionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                onPress={() => {
                  setShowOptionsModal(false);
                  resetForm();
                  setViewMode('habits');
                }}
              >
                <View style={[styles.optionIconContainer, { backgroundColor: theme.colors.success + '20' }]}>
                  <Icon name="leaf-outline" size={24} color={theme.colors.success} />
                </View>
                <View style={styles.optionTexts}>
                  <Text style={[styles.optionTitle, { color: theme.colors.text }]}>Evaluación de Hábitos</Text>
                  <Text style={[styles.optionDesc, { color: theme.colors.textSecondary }]} numberOfLines={1}>Contrasta tus hábitos protectores frente a los de riesgo.</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.optionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                onPress={() => {
                  setShowOptionsModal(false);
                  navigation.navigate('SubstanceExpense' as any);
                }}
              >
                <View style={[styles.optionIconContainer, { backgroundColor: theme.colors.error + '15' }]}>
                  <Icon name="wallet-outline" size={24} color={theme.colors.error} />
                </View>
                <View style={styles.optionTexts}>
                  <Text style={[styles.optionTitle, { color: theme.colors.text }]}>Gasto de Sustancias</Text>
                  <Text style={[styles.optionDesc, { color: theme.colors.textSecondary }]} numberOfLines={1}>Registra la inversión económica en el consumo.</Text>
                </View>
              </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal >
      </View >
    );
  };

  if (viewMode === 'calendar') {
    return renderCalendar();
  }

  if (completed) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center' }]}>
        <Card variant="elevated" padding="lg" style={styles.successCard}>
          <Icon name="checkmark-circle" size={80} color={theme.colors.success} />
          <Text style={[styles.successTitle, { color: theme.colors.text }]}>
            ¡Check-in Guardado!
          </Text>
          <Text style={[styles.successSubtitle, { color: theme.colors.textSecondary }]}>
            Tus registros del {selectedDate?.toLocaleDateString('es-CL')} se han guardado correctamente.
          </Text>
          <Button
            title="Volver al Calendario"
            onPress={() => {
              setCompleted(false);
            }}
            variant="outline"
            style={{ marginTop: 20 }}
          />
          <Button
            title="Ir al Dashboard"
            onPress={() => {
              setViewMode('calendar');
              setCompleted(false);
              navigation.navigate('Dashboard');
            }}
            variant="primary"
            style={{ marginTop: 12 }}
          />
        </Card>
      </View>
    );
  }

  if (['notes', 'activity', 'analysis', 'social', 'habits'].includes(viewMode)) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, flex: 1 }]}>
        {renderDatePickerModal()}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top, 30), paddingBottom: insets.bottom + 100 }]} keyboardShouldPersistTaps="handled">
          {renderDateSelector()}
          {viewMode === 'notes' && (
            <View style={styles.stepContainer}>
              <Text style={[styles.stepTitle, { color: theme.colors.text }]}>Notas Libres</Text>
              <Text style={[styles.description, { color: theme.colors.textSecondary }]}>Tómate tu tiempo. Escribe lo que rondó en tu mente hoy.</Text>
              <Input
                value={freeNotes}
                onChangeText={setFreeNotes}
                placeholder="Hoy me sentí..."
                multiline
                textAlignVertical="top"
                style={{ height: 300 }}
              />
            </View>
          )}

          {viewMode === 'activity' && (
            <View style={styles.stepContainer}>
              <Text style={[styles.stepTitle, { color: theme.colors.text }]}>Registro de Actividad</Text>
              <Input label="¿Qué actividad realizaste o realizarás?" value={activityName} onChangeText={setActivityName} placeholder="Ej. Ir al parque, fiesta familiar..." />
              <View style={{ height: 16 }} />
              <Input label="¿Cómo te sentiste ANTES?" value={feelingBefore} onChangeText={setFeelingBefore} multiline style={{ height: 80 }} placeholder="Emociones previas, expectativas..." />
              <View style={{ height: 16 }} />
              <Input label="¿Cómo te sentiste DURANTE?" value={feelingDuring} onChangeText={setFeelingDuring} multiline style={{ height: 80 }} placeholder="¿Qué pasó realmente en ese momento?" />
              <View style={{ height: 16 }} />
              <Input label="¿Cómo te sentiste DESPUÉS?" value={feelingAfter} onChangeText={setFeelingAfter} multiline style={{ height: 80 }} placeholder="Manejé la situación... me sentí..." />
            </View>
          )}

          {viewMode === 'analysis' && (
            <View style={styles.stepContainer}>
              <Text style={[styles.stepTitle, { color: theme.colors.text }]}>Análisis de Consumo / Impulso</Text>
              <Text style={[styles.description, { color: theme.colors.textSecondary }]}>Reflexionar ayuda a prevenir futuras caídas. Escribe con sinceridad.</Text>
              <Input label="¿Cuál fue la situación detonante?" value={analysisSituation} onChangeText={setAnalysisSituation} multiline style={{ height: 100 }} placeholder="Estaba en... y pasó..." />
              <View style={{ height: 16 }} />
              <Input label="¿Qué hiciste al respecto y qué sentiste?" value={analysisAction} onChangeText={setAnalysisAction} multiline style={{ height: 120 }} placeholder="Terminé consumiendo porque... O logré resistir pensando en..." />
            </View>
          )}

          {viewMode === 'social' && (
            <View style={styles.stepContainer}>
              <Text style={[styles.stepTitle, { color: theme.colors.text }]}>Entorno Social y Relaciones</Text>
              <Text style={[styles.description, { color: theme.colors.textSecondary }]}>Registra con quién pasaste tiempo y cómo afectó tu proceso.</Text>
              <Input label="¿Con quiénes interactuaste hoy?" value={socialPeople} onChangeText={setSocialPeople} multiline style={{ height: 100 }} placeholder="Amigos del trabajo, familiares, viejas amistades..." />
              <View style={{ height: 16 }} />
              <Input label="¿Sientes que te protegen o te exponen?" value={socialImpact} onChangeText={setSocialImpact} multiline style={{ height: 120 }} placeholder="Ej: Juan me protege animándome a hacer deporte. Pedro fomentó el consumo..." />
            </View>
          )}

          {viewMode === 'habits' && (
            <View style={styles.stepContainer}>
              <Text style={[styles.stepTitle, { color: theme.colors.text }]}>Hábitos Diarios</Text>
              <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
                Marca los hábitos que has logrado mantener el día de hoy.
              </Text>

              {loadingHabits ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: theme.colors.textSecondary }}>Cargando hábitos...</Text>
                </View>
              ) : habitsConfig.length === 0 ? (
                <Card variant="outlined" padding="lg" style={{ alignItems: 'center', marginBottom: 20 }}>
                  <Icon name="leaf-outline" size={48} color={theme.colors.textSecondary} style={{ marginBottom: 12 }} />
                  <Text style={{ color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 16 }}>
                    No tienes hábitos registrados aún. Comienza creando uno para mañana.
                  </Text>
                  <Button title="Crear mi primer hábito" size="sm" onPress={() => setShowAddHabit(true)} />
                </Card>
              ) : (
                <View style={{ gap: 12, marginBottom: 20 }}>
                  {habitsConfig.map((habit) => (
                    <TouchableOpacity
                      key={habit.id}
                      style={[
                        styles.habitCheckCard,
                        { 
                          backgroundColor: theme.colors.card, 
                          borderColor: habit.is_completed ? theme.colors.success : theme.colors.border,
                          borderWidth: habit.is_completed ? 2 : 1
                        }
                      ]}
                      onPress={() => toggleHabit(habit.id)}
                    >
                      <View style={[
                        styles.habitCheckbox,
                        { 
                          backgroundColor: habit.is_completed 
                            ? (habit.habit_type === 'negative' ? theme.colors.error : theme.colors.success) 
                            : 'transparent',
                          borderColor: habit.is_completed 
                            ? (habit.habit_type === 'negative' ? theme.colors.error : theme.colors.success) 
                            : theme.colors.textSecondary
                        }
                      ]}>
                        {habit.is_completed && <Icon name="checkmark" size={16} color="white" />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Icon 
                            name={habit.habit_type === 'negative' ? 'trending-down' : 'trending-up'} 
                            size={16} 
                            color={habit.habit_type === 'negative' ? theme.colors.error : theme.colors.success}
                            style={{ marginRight: 6 }}
                          />
                          <Text style={[
                            styles.habitCheckName, 
                            { 
                              color: theme.colors.text,
                              textDecorationLine: habit.is_completed ? 'line-through' : 'none',
                              opacity: habit.is_completed ? 0.6 : 1,
                              flex: 1
                            }
                          ]}>
                            {habit.name}
                          </Text>
                        </View>
                        {habit.description && (
                          <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }} numberOfLines={1}>
                            {habit.description}
                          </Text>
                        )}
                      </View>
                      
                      {!habit.is_completed && (
                        <TouchableOpacity 
                          onPress={() => deleteHabitDefinition(habit.id)}
                          style={{ padding: 8 }}
                        >
                          <Icon name="trash-outline" size={20} color={theme.colors.error} />
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  ))}
                  
                  <TouchableOpacity 
                    style={[styles.addHabitBtn, { borderColor: theme.colors.primary }]}
                    onPress={() => setShowAddHabit(true)}
                  >
                    <Icon name="add" size={20} color={theme.colors.primary} />
                    <Text style={{ color: theme.colors.primary, fontWeight: '600', marginLeft: 8 }}>Agregar un hábito</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Modal para agregar hábito */}
                <Modal visible={showAddHabit} transparent animationType="fade">
                  <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.card, minHeight: 300 }]}>
                      <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Nuevo Hábito</Text>
                        <TouchableOpacity onPress={() => setShowAddHabit(false)}>
                          <Icon name="close" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                      </View>
                      <Input 
                        label="¿Qué hábito quieres incorporar?" 
                        value={newHabitName} 
                        onChangeText={setNewHabitName} 
                        placeholder="Ej: Meditar 5 min, Tomar agua..." 
                        autoFocus
                      />
                      
                      <Text style={[styles.subTitle, { color: theme.colors.text, marginTop: 16 }]}>Tipo de Hábito</Text>
                      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                        <TouchableOpacity 
                          style={[
                            styles.typeSelector, 
                            { 
                              borderColor: newHabitType === 'positive' ? theme.colors.success : theme.colors.border,
                              backgroundColor: newHabitType === 'positive' ? theme.colors.success + '10' : 'transparent'
                            }
                          ]}
                          onPress={() => setNewHabitType('positive')}
                        >
                          <Icon name="happy-outline" size={24} color={newHabitType === 'positive' ? theme.colors.success : theme.colors.textSecondary} />
                          <Text style={{ color: newHabitType === 'positive' ? theme.colors.success : theme.colors.textSecondary, fontWeight: '600' }}>Saludable</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={[
                            styles.typeSelector, 
                            { 
                              borderColor: newHabitType === 'negative' ? theme.colors.error : theme.colors.border,
                              backgroundColor: newHabitType === 'negative' ? theme.colors.error + '10' : 'transparent'
                            }
                          ]}
                          onPress={() => setNewHabitType('negative')}
                        >
                          <Icon name="sad-outline" size={24} color={newHabitType === 'negative' ? theme.colors.error : theme.colors.textSecondary} />
                          <Text style={{ color: newHabitType === 'negative' ? theme.colors.error : theme.colors.textSecondary, fontWeight: '600' }}>Perjudicial</Text>
                        </TouchableOpacity>
                      </View>

                      <Button 
                        title="Guardar Hábito" 
                        onPress={addHabitDefinition} 
                        style={{ marginTop: 20 }} 
                        disabled={!newHabitName.trim()}
                      />
                    </View>
                  </View>
                </Modal>
            </View>
          )}
        </ScrollView>
        <View style={[styles.footer, { borderTopColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
          <Button title="Cancelar" onPress={() => setViewMode('calendar')} variant="outline" style={{ flex: 1 }} />
          <Button title={loading ? 'Guardando...' : 'Finalizar Registro'} onPress={submitCheckIn} variant="primary" disabled={loading} style={{ flex: 2 }} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, flex: 1 }]}>
      {renderDatePickerModal()}
      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            { backgroundColor: theme.colors.primary, width: `${((step + 1) / totalSteps) * 100}%` }
          ]}
        />
      </View>

        <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 && (
          <View style={styles.stepContainer}>
            {renderDateSelector()}
            <Text style={[styles.stepTitle, { color: theme.colors.text }]}>
              Control de Consumo
            </Text>
            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
              ¿Consumiste alguna sustancia o tuviste una recaída en esta fecha ({selectedDate?.toLocaleDateString('es-CL') || new Date().toLocaleDateString('es-CL')})?
            </Text>

            <View style={styles.consumptionRow}>
              <TouchableOpacity
                style={[
                  styles.consumptionBtn,
                  !consumed && { backgroundColor: theme.colors.success + '20', borderColor: theme.colors.success, borderWidth: 2 }
                ]}
                onPress={() => setConsumed(false)}
              >
                <Icon name="checkmark-circle-outline" size={40} color={!consumed ? theme.colors.success : theme.colors.textSecondary} />
                <Text style={{ color: !consumed ? theme.colors.success : theme.colors.textSecondary, fontWeight: 'bold' }}>NO CONSUMÍ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.consumptionBtn,
                  consumed && { backgroundColor: theme.colors.error + '20', borderColor: theme.colors.error, borderWidth: 2 }
                ]}
                onPress={() => setConsumed(true)}
              >
                <Icon name="alert-circle-outline" size={40} color={consumed ? theme.colors.error : theme.colors.textSecondary} />
                <Text style={{ color: consumed ? theme.colors.error : theme.colors.textSecondary, fontWeight: 'bold' }}>SÍ CONSUMÍ</Text>
              </TouchableOpacity>
            </View>

            {consumed && (
              <View style={{ marginTop: 24 }}>
                <Input
                  label="¿Qué cantidad y de qué sustancia?"
                  value={consumedAmount}
                  onChangeText={setConsumedAmount}
                  placeholder="Ej: 2 copas de alcohol, 1 gramo..."
                  autoFocus
                />
              </View>
            )}
          </View>
        )}

        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: theme.colors.text }]}>
              ¿Cómo estuvo tu ánimo?
            </Text>
            <Slider
              value={mood}
              onChange={setMood}
              min={1}
              max={10}
              labels={['Muy mal', 'Mal', 'Regular', 'Bien', 'Excelente']}
              emojis={['😢', '😔', '😐', '🙂', '😊']}
            />

            <Text style={[styles.subTitle, { color: theme.colors.textSecondary, marginTop: 24 }]}>
              Selecciona cómo te sientes:
            </Text>

            {/* Filtro de categorías de emociones */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
              {EMOTION_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: selectedCategory === cat.key ? cat.color : theme.colors.card,
                      borderColor: cat.color
                    }
                  ]}
                  onPress={() => setSelectedCategory(cat.key)}
                >
                  <Text style={[
                    styles.categoryLabel,
                    { color: selectedCategory === cat.key ? 'white' : cat.color }
                  ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.tagsGrid}>
              {(selectedCategory === 'all'
                ? EMOTIONAL_TAGS
                : EMOTIONAL_TAGS.filter(tag => tag.category === selectedCategory)
              ).map(tag => (
                <TouchableOpacity
                  key={tag.value}
                  style={[
                    styles.tagChip,
                    {
                      backgroundColor: selectedTags.includes(tag.value)
                        ? theme.colors.primary
                        : theme.colors.card,
                      borderColor: theme.colors.border
                    }
                  ]}
                  onPress={() => handleTagToggle(tag.value)}
                >
                  <Text style={styles.tagEmoji}>{tag.emoji}</Text>
                  <Text style={[
                    styles.tagLabel,
                    { color: selectedTags.includes(tag.value) ? 'white' : theme.colors.text }
                  ]}>
                    {tag.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: theme.colors.text }]}>
              Niveles de Energía y Ansiedad
            </Text>

            <View style={styles.sliderBox}>
              <Text style={[styles.sliderLabel, { color: theme.colors.text }]}>Ansiedad</Text>
              <Slider
                value={anxiety}
                onChange={setAnxiety}
                min={1}
                max={10}
                labels={['Calma', 'Baja', 'Moderada', 'Alta', 'Crisis']}
                emojis={['🧘', '😌', '😟', '😰', '🆘']}
              />
            </View>

            <View style={styles.sliderBox}>
              <Text style={[styles.sliderLabel, { color: theme.colors.text }]}>Energía</Text>
              <Slider
                value={energy}
                onChange={setEnergy}
                min={1}
                max={10}
                labels={['Agotado', 'Baja', 'Normal', 'Alta', 'Eufórico']}
                emojis={['🔋', '🪫', '😐', '⚡', '🚀']}
              />
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: theme.colors.text }]}>
              Salud y Actividad
            </Text>

            <Input
              label="Horas de sueño"
              value={sleepHours}
              onChangeText={setSleepHours}
              keyboardType="numeric"
              placeholder="Ej: 8"
            />

            <TouchableOpacity
              style={[
                styles.checkboxCard,
                { backgroundColor: exercised ? theme.colors.primary + '10' : theme.colors.card }
              ]}
              onPress={() => setExercised(!exercised)}
            >
              <View style={styles.checkboxRow}>
                <View style={[
                  styles.checkbox,
                  {
                    borderColor: theme.colors.primary,
                    backgroundColor: exercised ? theme.colors.primary : 'transparent'
                  }
                ]}>
                  {exercised && <Icon name="checkmark" size={16} color="white" />}
                </View>
                <Text style={[styles.checkboxText, { color: theme.colors.text }]}>
                  ¿Hiciste ejercicio hoy?
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: theme.colors.text }]}>
              Salud y Actividad
            </Text>

            <Input
              label="Horas de sueño"
              value={sleepHours}
              onChangeText={setSleepHours}
              keyboardType="numeric"
              placeholder="Ej: 8"
            />

            <TouchableOpacity
              style={[
                styles.checkboxCard,
                { backgroundColor: exercised ? theme.colors.primary + '10' : theme.colors.card }
              ]}
              onPress={() => setExercised(!exercised)}
            >
              <View style={styles.checkboxRow}>
                <View style={[
                  styles.checkbox,
                  {
                    borderColor: theme.colors.primary,
                    backgroundColor: exercised ? theme.colors.primary : 'transparent'
                  }
                ]}>
                  {exercised && <Icon name="checkmark" size={16} color="white" />}
                </View>
                <Text style={[styles.checkboxText, { color: theme.colors.text }]}>
                  ¿Hiciste ejercicio hoy?
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {step === 4 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: theme.colors.text }]}>
              Notas Adicionales
            </Text>
            <Text style={[styles.description, { color: theme.colors.textSecondary, textAlign: 'left' }]}>
              ¿Hay algo más que quieras registrar sobre este día?
            </Text>

            <Input
              value={notes}
              onChangeText={setNotes}
              placeholder="Escribe tus pensamientos aquí..."
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              style={{ height: 150 }}
            />
          </View>
        )}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={[styles.footer, { borderTopColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
        {step > 0 && (
          <Button
            title="Atrás"
            onPress={handleBack}
            variant="outline"
            style={{ flex: 1 }}
          />
        )}
        <Button
          title={step === totalSteps - 1 ? (loading ? 'Enviando...' : 'Finalizar') : 'Siguiente'}
          onPress={handleNext}
          variant="primary"
          disabled={loading}
          style={{ flex: 2 }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  calendarContainer: {
    padding: 20,
    backgroundColor: '#121212',
    flexGrow: 1,
    paddingBottom: 100,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerControls: {
    flexDirection: 'row',
    gap: 16,
  },
  monthTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  daysWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  dayWeekText: {
    width: 40,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: (width - 40 - 28) / 7, // 40 de padding horizontal + 28 de los márgenes internos (2*2*7)
    height: (width - 40 - 28) / 7,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
  },
  dayText: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 16,
  },
  dayDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayDetailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  dayContent: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailNotes: {
    fontStyle: 'italic',
    marginTop: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#4ECDC4',
    paddingLeft: 12,
  },
  dotIndicator: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    position: 'absolute',
    bottom: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    gap: 4,
  },
  dateSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  miniEditBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#aaa',
  },
  sobrietyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  sobrietyValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 65,
    height: 65,
    borderRadius: 33,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  consumptionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  consumptionBtn: {
    flex: 1,
    height: 100,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  container: {
    flex: 1,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#eee',
    width: '100%',
  },
  progressBar: {
    height: '100%',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 110,
    flexGrow: 1,
  },
  stepContainer: {
    width: '100%',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    marginBottom: 20,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagEmoji: {
    fontSize: 18,
    marginRight: 6,
  },
  tagLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  sliderBox: {
    marginBottom: 30,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  checkboxCard: {
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxText: {
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
  },
  successCard: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  successSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  optionIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionTexts: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  optionDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  feedCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  feedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  feedIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Estilos para el Feed de Bitácora
  feedContainer: {
    marginTop: 20,
  },
  feedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  feedIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  feedContent: {
    flex: 1,
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  feedType: {
    fontSize: 13,
    fontWeight: '600',
  },
  feedDate: {
    fontSize: 12,
  },
  feedPreview: {
    fontSize: 14,
    lineHeight: 18,
  },
  feedLoading: {
    padding: 30,
    alignItems: 'center',
  },
  feedEmpty: {
    padding: 30,
    alignItems: 'center',
  },
  feedEmptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  // Estilos para las tarjetas de detalle del feed
  feedDetailCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  feedDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  feedDetailIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  feedDetailTitleContainer: {
    flex: 1,
  },
  feedDetailType: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  feedDetailDate: {
    fontSize: 13,
    marginTop: 2,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedCardContent: {
    gap: 8,
  },
  feedNoteText: {
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  habitSection: {
    marginTop: 4,
  },
  habitTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  habitText: {
    fontSize: 14,
    lineHeight: 20,
  },
  socialText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
  },
  feelingSection: {
    marginTop: 8,
    paddingLeft: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#8E8E93',
  },
  feelingText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  // Estilos para el filtro de categorías de emociones
  categoryFilter: {
    marginBottom: 12,
    marginTop: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  // Estilos para la gestión de hábitos
  habitCheckCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  habitCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitCheckName: {
    fontSize: 16,
    fontWeight: '500',
  },
  addHabitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  typeSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
});