/**
 * NotesScreen - Pantalla de Notas del usuario y agente
 * KogniRecovery
 *
 * Permite:
 * - Ver todas las notas (usuario + agente IA)
 * - Crear nuevas notas
 * - Eliminar notas
 * - Fijar/desfijar notas
 * - Filtrar por origen (todas / mías / del agente)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api } from '@services/api';
import { NOTES_ENDPOINTS } from '@services/endpoints';
import { ApiResponse } from '../../types/api';
import { NotesStackParamList } from '../../navigation/types';
import Icon from '@expo/vector-icons/Ionicons';
import Markdown from 'react-native-markdown-display';

// ─── Interfaces ────────────────────────────────────────────────────────────────

interface Note {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  source: 'user' | 'agent';
  category: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

type FilterMode = 'all' | 'user' | 'agent';

// ─── Componentes internos ──────────────────────────────────────────────────────

interface NoteCardProps {
  note: Note;
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
  onPress: (note: Note) => void;
  theme: any;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onPin, onDelete, onPress, theme }) => {
  const isAgent = note.source === 'agent';
  const sourceIcon = isAgent ? 'sparkles' : 'person';
  const sourceLabel = isAgent ? 'LÚA' : 'Tú';
  const date = new Date(note.created_at);
  const dateStr = `${date.toLocaleDateString('es-CL')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(note)}
      style={[
        styles.noteCard,
        {
          backgroundColor: theme.colors.card,
          borderColor: note.is_pinned ? theme.colors.primary + '60' : theme.colors.border,
          borderWidth: note.is_pinned ? 1.5 : 1,
        },
      ]}
    >
      <View style={styles.noteHeader}>
        <View style={styles.noteSourceRow}>
          <Icon
            name={sourceIcon}
            size={14}
            color={isAgent ? theme.colors.primary : theme.colors.textSecondary}
          />
          <Text
            style={[
              styles.noteSource,
              { color: isAgent ? theme.colors.primary : theme.colors.textSecondary },
            ]}
          >
            {sourceLabel}
          </Text>
          <Text style={[styles.noteDate, { color: theme.colors.textSecondary }]}>{dateStr}</Text>
        </View>
        <View style={styles.noteActions}>
          <TouchableOpacity
            onPress={() => onPin(note.id)}
            style={styles.actionBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon
              name={note.is_pinned ? 'pin' : 'pin-outline'}
              size={18}
              color={note.is_pinned ? theme.colors.primary : theme.colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onDelete(note.id)}
            style={styles.actionBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="trash-outline" size={18} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {note.title ? (
        <Text style={[styles.noteTitle, { color: theme.colors.text }]} numberOfLines={2}>
          {note.title}
        </Text>
      ) : null}

      <View style={styles.noteContentContainer}>
        <Markdown
          style={{
            body: { color: theme.colors.textSecondary, fontSize: 14, lineHeight: 20 },
            paragraph: { marginBottom: 6 },
            text: { color: theme.colors.textSecondary },
            strong: { fontWeight: 'bold' },
            em: { fontStyle: 'italic' },
            bullet_list: { marginBottom: 6 },
            ordered_list: { marginBottom: 6 },
            heading1: { fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
            heading2: { fontSize: 15, fontWeight: 'bold', marginBottom: 6 },
            heading3: { fontSize: 14, fontWeight: 'bold', marginBottom: 6 },
            code_block: { backgroundColor: theme.colors.surface, padding: 4, borderRadius: 4 },
            code_inline: {
              backgroundColor: theme.colors.surface,
              paddingHorizontal: 2,
              borderRadius: 2,
            },
            link: { color: theme.colors.primary },
          }}
        >
          {note.content}
        </Markdown>
      </View>

      {note.category ? (
        <View style={[styles.categoryBadge, { backgroundColor: theme.colors.primary + '15' }]}>
          <Text style={[styles.categoryText, { color: theme.colors.primary }]}>
            {note.category}
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

// ─── Pantalla principal ────────────────────────────────────────────────────────

export const NotesScreen: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<NotesStackParamList>>();

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchNotes = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (filterMode !== 'all') {
        params.source = filterMode;
      }
      const response = await api.get<ApiResponse<Note[]>>(NOTES_ENDPOINTS.LIST, params);
      if (response.success) {
        setNotes(response.data);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterMode]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotes();
  }, [fetchNotes]);

  const handleCreateNote = async () => {
    if (!newContent.trim()) {
      Alert.alert('Error', 'El contenido de la nota es requerido.');
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, string> = { content: newContent.trim() };
      if (newTitle.trim()) body.title = newTitle.trim();
      const response = await api.post<ApiResponse<Note>>(NOTES_ENDPOINTS.CREATE, body);
      if (response.success) {
        setNotes((prev) => [response.data, ...prev]);
        setModalVisible(false);
        setNewTitle('');
        setNewContent('');
      }
    } catch (error) {
      console.error('Error creating note:', error);
      Alert.alert('Error', 'No se pudo guardar la nota.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = (id: string) => {
    Alert.alert('Eliminar nota', '¿Estás seguro de que quieres eliminar esta nota?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(NOTES_ENDPOINTS.DELETE(id));
            setNotes((prev) => prev.filter((n) => n.id !== id));
          } catch (error) {
            console.error('Error deleting note:', error);
          }
        },
      },
    ]);
  };

  const handleTogglePin = async (id: string) => {
    try {
      const response = await api.patch<ApiResponse<Note>>(NOTES_ENDPOINTS.TOGGLE_PIN(id));
      if (response.success) {
        setNotes((prev) => prev.map((n) => (n.id === id ? response.data : n)));
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const filterButtons: { key: FilterMode; label: string }[] = [
    { key: 'all', label: 'Todas' },
    { key: 'user', label: 'Mis notas' },
    { key: 'agent', label: 'LÚA' },
  ];

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Notas</Text>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
        >
          <Icon name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {filterButtons.map((btn) => (
          <TouchableOpacity
            key={btn.key}
            onPress={() => setFilterMode(btn.key)}
            style={[
              styles.filterBtn,
              {
                backgroundColor:
                  filterMode === btn.key ? theme.colors.primary : theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterBtnText,
                { color: filterMode === btn.key ? '#FFFFFF' : theme.colors.textSecondary },
              ]}
            >
              {btn.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NoteCard
            note={item}
            onPin={handleTogglePin}
            onDelete={handleDeleteNote}
            onPress={(note) => navigation.navigate('NoteDetail', { note })}
            theme={theme}
          />
        )}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="document-text-outline" size={48} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No hay notas{' '}
              {filterMode === 'agent' ? 'del agente' : filterMode === 'user' ? 'propias' : ''} aún
            </Text>
          </View>
        }
      />

      {/* Modal para crear nota */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Nueva nota</Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setNewTitle('');
                  setNewContent('');
                }}
              >
                <Icon name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.titleInput,
                {
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
              ]}
              placeholder="Título (opcional)"
              placeholderTextColor={theme.colors.textSecondary}
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <TextInput
              style={[
                styles.contentInput,
                {
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
              ]}
              placeholder="Escribe tu nota..."
              placeholderTextColor={theme.colors.textSecondary}
              value={newContent}
              onChangeText={setNewContent}
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity
              onPress={handleCreateNote}
              disabled={saving || !newContent.trim()}
              style={[
                styles.saveButton,
                {
                  backgroundColor:
                    saving || !newContent.trim()
                      ? theme.colors.primary + '60'
                      : theme.colors.primary,
                },
              ]}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Guardar nota</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ─── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  noteCard: {
    borderRadius: 12,
    padding: 14,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  noteSourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noteSource: {
    fontSize: 12,
    fontWeight: '600',
  },
  noteDate: {
    fontSize: 11,
  },
  noteActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    padding: 2,
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  noteContentContainer: {
    maxHeight: 100,
    overflow: 'hidden',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  titleInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 12,
  },
  contentInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 140,
    marginBottom: 16,
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
