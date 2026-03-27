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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@navigation/types';
import Icon from '@expo/vector-icons/Ionicons';
import apiClient from '@services/api';
import { AUTH_ENDPOINTS } from '@services/endpoints';

export const ForgotPasswordScreen: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState('');

  const validateEmail = (value: string): boolean => {
    if (!value) {
      setEmailError('Por favor ingresa tu correo electrónico');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError('Por favor ingresa un correo electrónico válido');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSendResetLink = async () => {
    if (!validateEmail(email)) return;

    setIsLoading(true);
    try {
      await apiClient.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, { email });
      setEmailSent(true);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.message || 'No se pudo enviar el correo de recuperación. Intenta nuevamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  if (emailSent) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <LinearGradient
          colors={[theme.colors.primary + '15', theme.colors.background]}
          style={StyleSheet.absoluteFill}
        />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(insets.top, 60),
              paddingBottom: Math.max(insets.bottom, 24),
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.successContainer}>
            <View style={[styles.successIcon, { backgroundColor: theme.colors.primary + '15' }]}>
              <Icon name="mail-outline" size={48} color={theme.colors.primary} />
            </View>

            <Text style={[styles.title, { color: theme.colors.text }]}>Revisa tu correo</Text>

            <Text style={[styles.successMessage, { color: theme.colors.textSecondary }]}>
              Hemos enviado un enlace de recuperación a{'\n'}
              <Text style={{ fontWeight: '700', color: theme.colors.text }}>{email}</Text>
            </Text>

            <Text style={[styles.instructions, { color: theme.colors.textSecondary }]}>
              Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
              El enlace expirará en 15 minutos.
            </Text>

            <View style={styles.successActions}>
              <Button
                title="Volver al inicio de sesión"
                onPress={navigateToLogin}
                variant="primary"
                size="lg"
                fullWidth
              />

              <TouchableOpacity style={styles.resendLink} onPress={() => setEmailSent(false)}>
                <Text style={[styles.resendText, { color: theme.colors.primary }]}>
                  ¿No recibiste el correo? Reenviar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[theme.colors.primary + '15', theme.colors.background]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: Math.max(insets.top, 60),
              paddingBottom: Math.max(insets.bottom, 24),
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary }]}>
              <Icon name="lock-closed-outline" size={40} color="white" />
            </View>

            <Text style={[styles.title, { color: theme.colors.text }]}>Recuperar Contraseña</Text>

            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Correo Electrónico"
              placeholder="ejemplo@correo.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={emailError}
            />

            <View style={styles.buttonContainer}>
              <Button
                title="Enviar enlace"
                onPress={handleSendResetLink}
                variant="primary"
                size="lg"
                loading={isLoading}
                fullWidth
              />
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={navigateToLogin}>
              <View style={styles.backLink}>
                <Icon name="arrow-back-outline" size={18} color={theme.colors.primary} />
                <Text style={[styles.backText, { color: theme.colors.primary }]}>
                  Volver al inicio de sesión
                </Text>
              </View>
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
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
    fontWeight: '500',
  },
  form: {
    width: '100%',
    gap: 4,
  },
  buttonContainer: {
    marginTop: 12,
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
  },
  successContainer: {
    alignItems: 'center',
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  instructions: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  successActions: {
    width: '100%',
    gap: 16,
  },
  resendLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
