/**
 * NoteDetailScreen - Vista completa de una nota en Markdown
 * KogniRecovery
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme/ThemeContext';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NotesStackParamList } from '../../navigation/types';
import Icon from '@expo/vector-icons/Ionicons';
import Markdown from 'react-native-markdown-display';

type NoteDetailRouteProp = RouteProp<NotesStackParamList, 'NoteDetail'>;
type NoteDetailNavProp = NativeStackNavigationProp<NotesStackParamList, 'NoteDetail'>;

export const NoteDetailScreen: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NoteDetailNavProp>();
  const route = useRoute<NoteDetailRouteProp>();
  const { note } = route.params;

  const isAgent = note.source === 'agent';
  const sourceIcon = isAgent ? 'sparkles' : 'person';
  const sourceLabel = isAgent ? 'LÚA' : 'Tú';
  const date = new Date(note.created_at);
  const dateStr = `${date.toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} - ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

  const markdownStyle = {
    body: { color: theme.colors.text, fontSize: 16, lineHeight: 26 },
    paragraph: { marginBottom: 14, color: theme.colors.text },
    bullet_list: { marginBottom: 14 },
    ordered_list: { marginBottom: 14 },
    bullet_list_icon: { color: theme.colors.text },
    ordered_list_icon: { color: theme.colors.text },
    code_block: {
      backgroundColor: theme.colors.surface,
      padding: 14,
      borderRadius: 8,
      color: theme.colors.primary,
      fontSize: 14,
    },
    fence: {
      backgroundColor: theme.colors.surface,
      padding: 14,
      borderRadius: 8,
      color: theme.colors.primary,
      fontSize: 14,
    },
    strong: { fontWeight: 'bold' as const, color: theme.colors.text },
    em: { fontStyle: 'italic' as const, color: theme.colors.text },
    heading1: {
      color: theme.colors.text,
      fontSize: 26,
      fontWeight: 'bold' as const,
      marginVertical: 16,
    },
    heading2: {
      color: theme.colors.text,
      fontSize: 22,
      fontWeight: 'bold' as const,
      marginVertical: 14,
    },
    heading3: {
      color: theme.colors.text,
      fontSize: 19,
      fontWeight: 'bold' as const,
      marginVertical: 10,
    },
    text: { color: theme.colors.text },
    link: { color: theme.colors.primary, textDecorationLine: 'underline' as const },
    blockquote: {
      backgroundColor: theme.colors.surface,
      borderLeftColor: theme.colors.primary,
      borderLeftWidth: 4,
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginVertical: 12,
      borderRadius: 4,
    },
    code_inline: {
      backgroundColor: theme.colors.surface,
      color: theme.colors.secondary,
      paddingHorizontal: 6,
      borderRadius: 4,
      fontSize: 15,
    },
    hr: {
      backgroundColor: theme.colors.border,
      height: 1,
      marginVertical: 20,
    },
    table: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 6,
      marginVertical: 12,
    },
    thead: { backgroundColor: theme.colors.surface },
    th: { padding: 10, fontWeight: 'bold' as const, color: theme.colors.text },
    td: {
      padding: 10,
      color: theme.colors.text,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <View style={styles.sourceRow}>
            <Icon
              name={sourceIcon}
              size={14}
              color={isAgent ? theme.colors.primary : theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.sourceLabel,
                { color: isAgent ? theme.colors.primary : theme.colors.textSecondary },
              ]}
            >
              {sourceLabel}
            </Text>
            {note.is_pinned && (
              <Icon name="pin" size={14} color={theme.colors.primary} style={{ marginLeft: 4 }} />
            )}
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {note.title ? (
          <Text style={[styles.title, { color: theme.colors.text }]}>{note.title}</Text>
        ) : null}

        <Text style={[styles.date, { color: theme.colors.textSecondary }]}>{dateStr}</Text>

        {note.category ? (
          <View style={[styles.categoryBadge, { backgroundColor: theme.colors.primary + '15' }]}>
            <Text style={[styles.categoryText, { color: theme.colors.primary }]}>
              {note.category}
            </Text>
          </View>
        ) : null}

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <Markdown style={markdownStyle}>{note.content}</Markdown>
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerInfo: {
    flex: 1,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sourceLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 6,
    lineHeight: 34,
  },
  date: {
    fontSize: 13,
    marginBottom: 10,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginBottom: 20,
  },
});
