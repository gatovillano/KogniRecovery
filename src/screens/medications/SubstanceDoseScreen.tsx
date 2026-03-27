import React, { useState, useEffect, useCallback } from 'react';
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
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme/ThemeContext';
import { api } from '@services/api';
import Icon from '@expo/vector-icons/Ionicons';
import { useRoute, RouteProp } from '@react-navigation/native';
import { MainTabParamList } from '@navigation/types';

interface SubstanceDose {
  id: string;
  substance_name: string;
  quantity: number;
  unit: string;
  dose_time: string;
  craving_intensity?: number;
  feelings?: string;
  context_notes?: string;
}

export const SubstanceDoseScreen: React.FC<{
  route: RouteProp<MainTabNavigatorParamList, 'SubstanceDose'>;
}> = ({ route }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [doses, setDoses] = useState<SubstanceDose[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    substance_name: '',
    quantity: '1',
    unit: 'unidades',
    craving_intensity: '5',
    feelings: '',
    context_notes: '',
  });
  const [editingDoseId, setEditingDoseId] = useState<string | null>(null);

  const fetchDoses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<{ success: boolean; data: SubstanceDose[] }>(
        '/substance-doses'
      );
      if (response?.success) {
        setDoses(response.data);
      }
    } catch (error) {
      console.error('Error fetching doses:', error);
      Alert.alert('Error', 'No se pudieron cargar las dosis.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoses();
    const doseId = route.params?.doseId;
    if (doseId) {
      setEditingDoseId(doseId);
      // Fetch the specific dose to populate the form
      api
        .get<{ success: boolean; data: SubstanceDose }>(`/substance-doses/${doseId}`)
        .then((response) => {
          if (response?.success && response.data) {
            const dose = response.data;
            setForm({
              substance_name: dose.substance_name,
              quantity: dose.quantity.toString(),
              unit: dose.unit,
              craving_intensity: dose.craving_intensity?.toString() || '5',
              feelings: dose.feelings || '',
              context_notes: dose.context_notes || '',
            });
          }
        })
        .catch((error) => {
          console.error('Error fetching dose for edit:', error);
          Alert.alert('Error', 'No se pudo cargar la dosis para editar.');
        });
    }
  }, [fetchDoses, route.params?.doseId]);

  const handleSave = async () => {
    if (!form.substance_name.trim()) {
      Alert.alert('Error', 'El nombre de la sustancia es obligatorio.');
      return;
    }

    setSaving(true);
    try {
      let response;
      if (editingDoseId) {
        // Update existing dose
        response = await api.put<{ success: boolean; data: SubstanceDose }>(
          `/substance-doses/${editingDoseId}`,
          {
            ...form,
            quantity: parseFloat(form.quantity),
            craving_intensity: parseInt(form.craving_intensity),
          }
        );
      } else {
        // Create new dose
        response = await api.post<{ success: boolean; data: SubstanceDose }>('/substance-doses', {
          ...form,
          quantity: parseFloat(form.quantity),
          craving_intensity: parseInt(form.craving_intensity),
        });
      }

      if (response?.success) {
        setShowModal(false);
        setForm({
          substance_name: '',
          quantity: '1',
          unit: 'unidades',
          craving_intensity: '5',
          feelings: '',
          context_notes: '',
        });
        setEditingDoseId(null);
        fetchDoses();
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el registro.');
    } finally {
      setSaving(false);
    }
  };

  const renderDoseItem = ({ item }: { item: SubstanceDose }) => {
    const doseDate = new Date(item.dose_time);
    const formattedDate = doseDate.toLocaleDateString('es-CL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    const formattedTime = doseDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const cravingHigh = (item.craving_intensity ?? 0) > 7;

    return (
      <View
        style={[
          styles.doseCard,
          { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
        ]}
      >
        <View style={styles.doseHeader}>
          <View
            style={[styles.doseIconContainer, { backgroundColor: theme.colors.primary + '20' }]}
          >
            <Icon name="flask-outline" size={22} color={theme.colors.primary} />
          </View>
          <View style={styles.doseTitleContainer}>
            <Text style={[styles.doseTypeLabel, { color: theme.colors.primary }]}>
              {item.substance_name}
            </Text>
            <Text style={[styles.doseDate, { color: theme.colors.textSecondary }]}>
              {formattedDate} · {formattedTime}
            </Text>
          </View>
        </View>

        <View style={styles.doseContent}>
          <View style={styles.detailRow}>
            <Icon name="analytics-outline" size={20} color={theme.colors.primary} />
            <Text style={{ color: theme.colors.text }}>
              Cantidad:{' '}
              <Text style={{ fontWeight: '600' }}>
                {item.quantity} {item.unit}
              </Text>
            </Text>
          </View>

          {item.craving_intensity != null && (
            <View style={styles.detailRow}>
              <Icon
                name="pulse-outline"
                size={20}
                color={cravingHigh ? theme.colors.error : '#FF9500'}
              />
              <Text style={{ color: theme.colors.text }}>Ansiedad previa: </Text>
              <View
                style={[
                  styles.intensityBadge,
                  {
                    backgroundColor: cravingHigh
                      ? theme.colors.error + '20'
                      : theme.colors.primary + '20',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.intensityText,
                    { color: cravingHigh ? theme.colors.error : theme.colors.primary },
                  ]}
                >
                  {item.craving_intensity}/10
                </Text>
              </View>
            </View>
          )}

          {item.context_notes && (
            <View style={styles.detailRow}>
              <Icon name="document-text-outline" size={20} color={theme.colors.textSecondary} />
              <Text style={{ color: theme.colors.textSecondary, flex: 1 }} numberOfLines={2}>
                {item.context_notes}
              </Text>
            </View>
          )}

          {item.feelings && (
            <View style={{ marginTop: 8 }}>
              <Text style={[styles.feelingsLabel, { color: theme.colors.textSecondary }]}>
                Emociones:
              </Text>
              <Text style={[styles.feelingsText, { color: theme.colors.text }]} numberOfLines={2}>
                "{item.feelings}"
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 12,
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Dosis Individuales</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => setShowModal(true)}
        >
          <Icon name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={doses}
          renderItem={renderDoseItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="beaker-outline" size={64} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                No hay dosis registradas aún.
              </Text>
            </View>
          }
        />
      )}

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {editingDoseId ? 'Editar Dosis' : 'Registrar Dosis'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Icon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Sustancia</Text>
                <TextInput
                  style={[
                    styles.input,
                    { color: theme.colors.text, borderColor: theme.colors.border },
                  ]}
                  placeholder="Ej: Alcohol, Tabaco..."
                  placeholderTextColor={theme.colors.textSecondary}
                  value={form.substance_name}
                  onChangeText={(val) => setForm({ ...form, substance_name: val })}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                    Cantidad
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      { color: theme.colors.text, borderColor: theme.colors.border },
                    ]}
                    keyboardType="numeric"
                    value={form.quantity}
                    onChangeText={(val) => setForm({ ...form, quantity: val })}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1, marginLeft: 12 }]}>
                  <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Unidad</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { color: theme.colors.text, borderColor: theme.colors.border },
                    ]}
                    placeholder="vasos, cigs..."
                    value={form.unit}
                    onChangeText={(val) => setForm({ ...form, unit: val })}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                  Ansiedad / Craving (1-10)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { color: theme.colors.text, borderColor: theme.colors.border },
                  ]}
                  keyboardType="numeric"
                  value={form.craving_intensity}
                  onChangeText={(val) => setForm({ ...form, craving_intensity: val })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                  ¿Cómo te sientes?
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { color: theme.colors.text, borderColor: theme.colors.border, height: 80 },
                  ]}
                  multiline
                  placeholder="Describe tus emociones..."
                  placeholderTextColor={theme.colors.textSecondary}
                  value={form.feelings}
                  onChangeText={(val) => setForm({ ...form, feelings: val })}
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: theme.colors.primary }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Guardar Registro</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: { padding: 20 },
  doseCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  doseHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  doseIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  doseTitleContainer: { flex: 1 },
  doseTypeLabel: { fontSize: 16, fontWeight: 'bold' },
  doseDate: { fontSize: 13, marginTop: 2 },
  doseContent: { gap: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  intensityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  intensityText: { fontSize: 12, fontWeight: 'bold' },
  feelingsLabel: { fontSize: 12, marginBottom: 4 },
  feelingsText: { fontSize: 14, fontStyle: 'italic', lineHeight: 20 },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 14, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 16 },
  row: { flexDirection: 'row' },
  saveBtn: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
