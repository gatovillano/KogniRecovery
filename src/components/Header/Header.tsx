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
  action2Icon?: string;
  onAction2?: () => void;
  action2ButtonColor?: string;
  absolute?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  actionIcon = 'add',
  onAction,
  actionButtonColor,
  action2Icon,
  onAction2,
  absolute = false,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const headerStyle = [
    styles.header,
    absolute && {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
    },
    { paddingTop: insets.top + 20 },
  ];

  return (
    <View style={headerStyle}>
      <View style={styles.headerContent}>
        <View style={styles.headerTitleGroup}>
          <View>
            {subtitle && (
              <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
                {subtitle}
              </Text>
            )}
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{title}</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          {onAction2 && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onAction2}
              activeOpacity={0.6}
            >
              <Icon
                name={action2Icon as any}
                size={22}
                color={actionButtonColor || theme.colors.textSecondary}
              />
            </TouchableOpacity>
          )}
          {onAction && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onAction}
              activeOpacity={0.6}
            >
              <Icon
                name={actionIcon as any}
                size={22}
                color={actionButtonColor || theme.colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  headerTitleGroup: {
    flexDirection: 'column',
    gap: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.4,
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '300',
    letterSpacing: -0.5,
  },
  actionButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
    paddingBottom: 4,
  },
});
