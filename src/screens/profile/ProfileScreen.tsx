/**
 * ProfileScreen - Pantalla de perfil de usuario
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@theme/ThemeContext';
import { Button } from '@components';
import { authStore } from '@store/authStore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '@navigation/types';

export const ProfileScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user, logout } = authStore();
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();

  const handleLogout = async () => {
    await logout();
  };

  const menuItems = [
    { icon: '🧠', label: 'Motor de Inteligencia LÚA', onPress: () => navigation.navigate('AISettings') },
    { icon: '📒', label: 'Memoria de LÚA (Insights)', onPress: () => navigation.navigate('IntelligenceProfile') },
    { icon: '🔔', label: 'Notificaciones', onPress: () => {} },
    { icon: '🔒', label: 'Privacidad y Seguridad', onPress: () => {} },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {user ? (
          <View style={[styles.profileCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.avatarText}>
                {user.profile?.firstName?.[0] || user.email[0].toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.userName, { color: theme.colors.text }]}>
              {user.profile?.firstName} {user.profile?.lastName}
            </Text>
            <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>
              {user.email}
            </Text>
            <View style={[styles.badge, { backgroundColor: theme.colors.primary + '20' }]}>
              <Text style={[styles.userRole, { color: theme.colors.primary }]}>
                {user.role === 'patient' ? 'Paciente' : user.role}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={[styles.noUser, { color: theme.colors.textSecondary }]}>
            No hay usuario autenticado
          </Text>
        )}

        <View style={styles.menu}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>CONFIGURACIÓN</Text>

          <View style={[styles.menuGroup, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            {menuItems.map((item, index) => (
              <React.Fragment key={item.label}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={item.onPress}
                  activeOpacity={0.6}
                >
                  <Text style={styles.menuItemIcon}>{item.icon}</Text>
                  <Text style={[styles.menuItemText, { color: theme.colors.text }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.menuItemChevron, { color: theme.colors.textSecondary }]}>›</Text>
                </TouchableOpacity>
                {index < menuItems.length - 1 && (
                  <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        <View style={styles.logoutContainer}>
          <Button
            title="Cerrar Sesión"
            onPress={handleLogout}
            variant="outline"
            fullWidth
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 24,
  },
  profileCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    marginTop: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  userRole: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  noUser: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  menu: {
    gap: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
    marginBottom: 4,
    letterSpacing: 1,
  },
  menuGroup: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  menuItemIcon: {
    fontSize: 20,
    marginRight: 14,
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  menuItemChevron: {
    fontSize: 22,
    fontWeight: '300',
    marginLeft: 8,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 52,
  },
  logoutContainer: {
    marginBottom: 16,
  },
});