/**
 * Header - Componente de encabezado reutilizable
 *
 * Proporciona un encabezado consistente con título, subtítulo, icono y botón de acción.
 * Diseñado para ser usado en todas las pantallas de la aplicación.
 *
 * Ejemplo de uso:
 * <Header
 *   title="Medicamentos"
 *   subtitle="Registro de tomas diarias"
 *   icon="medkit-outline"
 *   onAction={() => openCreateModal()}
 * />
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@theme/ThemeContext';
import Icon from '@expo/vector-icons/Ionicons';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  actionIcon?: string;
  onAction?: () => void;
  actionButtonColor?: string;
  absolute?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  icon = 'ellipse-outline',
  actionIcon = 'add',
  onAction,
  actionButtonColor,
  absolute = false,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const headerStyle = absolute
    ? {
        ...styles.header,
        backgroundColor: theme.colors.surface,
        paddingTop: insets.top + 12,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
      }
    : {
        ...styles.header,
        backgroundColor: theme.colors.surface,
        paddingTop: insets.top + 12,
      };

  return (
    <View style={headerStyle}>
      <View style={styles.headerContent}>
        <View style={styles.headerTitleGroup}>
          {icon && (
            <View style={[styles.headerIcon, { backgroundColor: theme.colors.primary + '15' }]}>
              <Icon name={icon as any} size={22} color={theme.colors.primary} />
            </View>
          )}
          <View>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{title}</Text>
            {subtitle && (
              <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        {onAction && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: actionButtonColor || theme.colors.primary,
              },
            ]}
            onPress={onAction}
          >
            <Icon name={actionIcon as any} size={22} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
});
