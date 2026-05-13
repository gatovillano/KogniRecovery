import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input } from '@components';
import { authStore } from '@store/authStore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@navigation/types';
import Icon from '@expo/vector-icons/Ionicons';

export const LoginScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { login, isLoading, error, clearError } = authStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa tu correo y contraseña');
      return;
    }

    const success = await login({ email, password });
    if (!success && error) {
      Alert.alert('Error de Inicio de Sesión', error);
    }
  };

  const navigateToRegister = () => {
    clearError();
    navigation.navigate('Register');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={theme.gradients.hero as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.heroGradient}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(insets.top, 70),
              paddingBottom: Math.max(insets.bottom, 80),
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <LinearGradient
              colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.08)']}
              style={styles.logoIcon}
            >
              <Icon name="heart" size={36} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.title}>KogniRecovery</Text>
            <Text style={styles.subtitle}>Acompañándote en cada paso de tu recuperación</Text>
          </View>

          <View
            style={[
              styles.formCard,
              {
                backgroundColor: theme.colors.card,
                ...theme.shadows.lg,
              },
            ]}
          >
            <Text style={[styles.formTitle, { color: theme.colors.text }]}>Iniciar Sesión</Text>

            <Input
              label="Correo Electrónico"
              placeholder="ejemplo@correo.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <View>
              <Input
                label="Contraseña"
                placeholder="********"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
              />
              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={{ color: theme.colors.primary, fontWeight: '700', fontSize: 13 }}>
                  ¿Olvidaste tu contraseña?
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonContainer}>
              <Button
                title="Iniciar Sesión"
                onPress={handleLogin}
                variant="primary"
                size="lg"
                loading={isLoading}
                fullWidth
              />
            </View>
          </View>

          <View style={styles.footer}>
            <Text
              style={[
                styles.footerText,
                { color: isDark ? 'rgba(255,255,255,0.8)' : theme.colors.textSecondary },
              ]}
            >
              ¿No tienes una cuenta?
            </Text>
            <TouchableOpacity onPress={navigateToRegister}>
              <Text
                style={[styles.registerLink, { color: isDark ? '#FFFFFF' : theme.colors.primary }]}
              >
                Regístrate gratis
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    height: '55%',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.5,
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
  },
  formCard: {
    borderRadius: 24,
    padding: 24,
    gap: 4,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 20,
    paddingVertical: 4,
  },
  buttonContainer: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
    gap: 6,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
