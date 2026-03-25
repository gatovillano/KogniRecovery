import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@theme/ThemeContext';
import { Card, Button } from '@components';
import { api } from '@services/api';
import { SUBSTANCE_EXPENSE_ENDPOINTS } from '@services/endpoints';
import { ApiResponse } from '../../types/api';
import Icon from '@expo/vector-icons/Ionicons';

interface Expense {
  id: string;
  amount: number;
  currency: string;
  expense_date: string;
  description: string;
}

export const SubstanceExpenseScreen: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Form state
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await api.get<ApiResponse<any> & { total_spent?: number }>(SUBSTANCE_EXPENSE_ENDPOINTS.LIST);
      if (response && response.success) {
        setExpenses(response.data || []);
        setTotalSpent(response.total_spent || 0);
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
      Alert.alert('Error', 'No se pudieron cargar los gastos');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleAddExpense = async () => {
    if (!amount || isNaN(Number(amount))) {
      Alert.alert('Error', 'Por favor ingresa un monto válido');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post<ApiResponse<any>>(SUBSTANCE_EXPENSE_ENDPOINTS.CREATE, {
        amount: Number(amount),
        description: description,
        currency: 'CLP',
        expense_date: new Date().toISOString()
      });

      if (response && response.success) {
        setAmount('');
        setDescription('');
        setShowForm(false);
        loadData();
        Alert.alert('Éxito', 'Gasto registrado correctamente');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      Alert.alert('Error', 'No se pudo registrar el gasto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = (id: string) => {
    Alert.alert(
      'Eliminar Gasto',
      '¿Estás seguro de que deseas eliminar este registro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.delete<ApiResponse<any>>(SUBSTANCE_EXPENSE_ENDPOINTS.DELETE(id));
              if (response && response.success) {
                loadData();
              }
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el gasto');
            }
          }
        }
      ]
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[theme.colors.primary + '10', theme.colors.background]}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView
        style={{ flex: 1, paddingTop: insets.top }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Mis Gastos</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Seguimiento de inversión económica en el consumo
          </Text>
        </View>

        {/* Resumen Total */}
        <Card variant="elevated" padding="lg" style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={[styles.iconCircle, { backgroundColor: theme.colors.error + '15' }]}>
              <Icon name="wallet-outline" size={24} color={theme.colors.error} />
            </View>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Total Gastado</Text>
          </View>
          <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
            {formatCurrency(totalSpent)}
          </Text>
          <Text style={[styles.summaryNote, { color: theme.colors.textSecondary }]}>
            Este monto representa lo que podrías haber ahorrado o invertido en tu bienestar.
          </Text>
        </Card>

        {/* Botón para Mostrar Formulario */}
        {!showForm && (
          <Button 
            title="Registrar un Nuevo Gasto" 
            variant="primary" 
            onPress={() => setShowForm(true)}
            icon={<Icon name="add-circle-outline" size={20} color="white" />}
          />
        )}

        {/* Formulario para Agregar Gasto */}
        {showForm && (
          <Card variant="outlined" padding="md" style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={[styles.formTitle, { color: theme.colors.text }]}>Nuevo Registro</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Icon name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Monto (Pesos Chilenos)</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <Text style={[styles.currencyPrefix, { color: theme.colors.textSecondary }]}>$</Text>
                <TextInput
                  style={[styles.input, { color: theme.colors.text }]}
                  placeholder="Ej: 5000"
                  placeholderTextColor={theme.colors.textSecondary + '70'}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Descripción (Opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea, { 
                  backgroundColor: theme.colors.card, 
                  borderColor: theme.colors.border,
                  color: theme.colors.text
                }]}
                placeholder="¿En qué se gastó?"
                placeholderTextColor={theme.colors.textSecondary + '70'}
                multiline
                numberOfLines={2}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <View style={styles.formActions}>
              <Button 
                title="Guardar Registro" 
                variant="primary" 
                onPress={handleAddExpense}
                loading={isSubmitting}
                disabled={isSubmitting}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        )}

        {/* Listado de Gastos */}
        <View style={styles.listSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Historial Reciente</Text>
          
          {loading && !refreshing ? (
            <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} />
          ) : expenses.length > 0 ? (
            expenses.map((expense) => (
              <View key={expense.id} style={[styles.expenseItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <View style={styles.expenseInfo}>
                  <Text style={[styles.expenseAmount, { color: theme.colors.text }]}>
                    {formatCurrency(expense.amount)}
                  </Text>
                  <Text style={[styles.expenseDate, { color: theme.colors.textSecondary }]}>
                    {formatDate(expense.expense_date)}
                  </Text>
                  {expense.description ? (
                    <Text style={[styles.expenseDesc, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                      {expense.description}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity 
                  style={styles.deleteButton} 
                  onPress={() => handleDeleteExpense(expense.id)}
                >
                  <Icon name="trash-outline" size={20} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="receipt-outline" size={48} color={theme.colors.textSecondary + '40'} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                No tienes gastos registrados. ¡Eso es una excelente noticia para tu bolsillo!
              </Text>
            </View>
          )}
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
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 4,
    lineHeight: 20,
  },
  summaryCard: {
    alignItems: 'center',
    gap: 12,
  },
  summaryHeader: {
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryValue: {
    fontSize: 36,
    fontWeight: '800',
  },
  summaryNote: {
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 4,
  },
  formCard: {
    gap: 16,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formActions: {
    marginTop: 8,
  },
  listSection: {
    gap: 12,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  expenseInfo: {
    flex: 1,
    gap: 2,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  expenseDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  expenseDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  deleteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    gap: 12,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
  },
});

export default SubstanceExpenseScreen;
