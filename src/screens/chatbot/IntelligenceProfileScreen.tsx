import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme/ThemeContext';
import { useChatbot } from '@hooks/useChatbot';
import Icon from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';

export const IntelligenceProfileScreen: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { contextHistory, loadContextHistory, loading } = useChatbot();

  useEffect(() => {
    loadContextHistory();
  }, [loadContextHistory]);

  const getIconForType = (type: string) => {
    switch (type) {
      case 'preference': return 'star';
      case 'emotional_state': return 'heart';
      case 'goal': return 'flag';
      case 'history': return 'time';
      default: return 'bookmark';
    }
  };

  const getLabelForType = (type: string) => {
    switch (type) {
      case 'preference': return 'Preferencias';
      case 'emotional_state': return 'Estados Emocionales';
      case 'goal': return 'Objetivos';
      case 'history': return 'Antecedentes';
      default: return 'Otros';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[theme.colors.primary + '15', theme.colors.background]}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Memoria de LÚA</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Lo que LÚA ha aprendido para apoyarte mejor
        </Text>
      </View>

      <ScrollView 
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : contextHistory.length > 0 ? (
          contextHistory.map((item, index) => (
            <View 
              key={index} 
              style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
                  <Icon name={getIconForType(item.context_type)} size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.headerText}>
                  <Text style={[styles.typeLabel, { color: theme.colors.textSecondary }]}>
                    {getLabelForType(item.context_type)}
                  </Text>
                  <Text style={[styles.keyText, { color: theme.colors.text }]}>
                    {item.key.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                </View>
                <View style={[styles.importanceBadge, { backgroundColor: theme.colors.accent + '20' }]}>
                  <Text style={[styles.importanceText, { color: theme.colors.accent }]}>
                    ★ {item.importance}
                  </Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <Text style={[styles.valueText, { color: theme.colors.text }]}>
                  {typeof item.value === 'string' ? item.value : JSON.stringify(item.value)}
                </Text>
              </View>

              <View style={styles.cardFooter}>
                <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
                  Referenciado {item.times_referenced} veces
                </Text>
                <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
                  Última vez: {new Date(item.last_referenced_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="cloud-offline-outline" size={60} color={theme.colors.textSecondary + '40'} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              LÚA aún está conociéndote. Sigue charlando para que aprenda más sobre ti.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 4,
    opacity: 0.8,
    lineHeight: 20,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  keyText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  importanceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  importanceText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardBody: {
    marginBottom: 16,
  },
  valueText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  footerText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 22,
    fontSize: 15,
  },
});
