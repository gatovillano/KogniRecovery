import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@theme/ThemeContext';
import { Button } from '@components';
import { authStore } from '@store/authStore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '@navigation/types';
import Icon from '@expo/vector-icons/Ionicons';

export const ProfileScreen: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, logout } = authStore();
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();

  const handleLogout = async () => {
    await logout();
  };

  const menuItems = [
    {
      icon: 'hardware-chip-outline' as const,
      label: 'Motor de Inteligencia LÚA',
      onPress: () => navigation.navigate('AISettings'),
    },
    {
      icon: 'book-outline' as const,
      label: 'Memoria de LÚA (Insights)',
      onPress: () => navigation.navigate('IntelligenceProfile'),
    },
    { icon: 'notifications-outline' as const, label: 'Notificaciones', onPress: () => {} },
    {
      icon: 'shield-checkmark-outline' as const,
      label: 'Privacidad y Seguridad',
      onPress: () => {},
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Header */}
      <LinearGradient
        colors={theme.gradients.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.heroHeader, { paddingTop: insets.top + 24 }]}
      >
        {user ? (
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarGlow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {user.profile?.firstName?.[0] || user.email[0].toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
            <Text style={styles.userName}>
              {user.profile?.firstName} {user.profile?.lastName}
            </Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {user.role === 'patient' ? 'Paciente' : user.role}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.noUser}>No hay usuario autenticado</Text>
        )}
      </LinearGradient>

      <View style={styles.content}>
        {/* Menu Section */}
        <View style={styles.menu}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>CONFIGURACIÓN</Text>

          <View
            style={[
              styles.menuGroup,
              {
                backgroundColor: theme.colors.card,
                ...theme.shadows.md,
              },
            ]}
          >
            {menuItems.map((item, index) => (
              <React.Fragment key={item.label}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={item.onPress}
                  activeOpacity={0.6}
                >
                  <View
                    style={[
                      styles.menuIconContainer,
                      { backgroundColor: theme.colors.primary + '10' },
                    ]}
                  >
                    <Icon name={item.icon} size={20} color={theme.colors.primary} />
                  </View>
                  <Text style={[styles.menuItemText, { color: theme.colors.text }]}>
                    {item.label}
                  </Text>
                  <Icon name="chevron-forward" size={18} color={theme.colors.textSecondary} />
                </TouchableOpacity>
                {index < menuItems.length - 1 && (
                  <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Logout */}
        <View style={styles.logoutContainer}>
          <Button title="Cerrar Sesión" onPress={handleLogout} variant="outline" fullWidth />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroHeader: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  profileSection: {
    alignItems: 'center',
    gap: 8,
  },
  avatarContainer: {
    marginBottom: 8,
  },
  avatarGlow: {
    width: 96,
    height: 96,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginTop: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noUser: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
  },
  content: {
    flex: 1,
    padding: 20,
    gap: 24,
    marginTop: 8,
  },
  menu: {
    gap: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
    marginBottom: 4,
    letterSpacing: 1,
  },
  menuGroup: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 68,
  },
  logoutContainer: {
    marginBottom: 16,
  },
});
