/**
 * AISettingsScreen - Pantalla de configuración del motor de IA (LÚA)
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '@theme/ThemeContext';
import { Card, Button, Select } from '@components';
import { api, updateAISettings } from '@services/api';
import { useProfile } from '@hooks/useProfile';
import { useAuth } from '@hooks/useAuth';

export const AISettingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { profile, loadProfile } = useProfile();
  const { user, updateUser } = useAuth();

  const [provider, setProvider] = useState<'openai' | 'openrouter' | 'default'>(
    (user?.llm_provider as any) || 'default'
  );
  const [model, setModel] = useState(user?.llm_model || '');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [models, setModels] = useState<{ id: string; name: string }[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    const fetchModels = async () => {
      // Si es modo por defecto, no cargar modelos
      if (provider === 'default') {
        setModels([]);
        return;
      }

      setLoadingModels(true);
      try {
        const response = await api.getAIModels(provider);
        if (response.success && response.data) {
          setModels(response.data);
          // Si no hay modelo seleccionado o el actual no está en la lista, seleccionar el primero
          if (!model || !response.data.find((m: any) => m.id === model)) {
            setModel(response.data[0]?.id || '');
          }
        }
      } catch (error) {
        console.error('Error fetching models:', error);
      } finally {
        setLoadingModels(false);
      }
    };

    fetchModels();
  }, [provider]);

  useEffect(() => {
    // Cargar configuración guardada del usuario
    if (user) {
      if (user.llm_provider) {
        setProvider(user.llm_provider as any);
      } else {
        setProvider('default');
      }
      if (user.llm_model) {
        setModel(user.llm_model);
      }
    }
  }, [user]);

  const handleSaveAISettings = async () => {
    // Si es modo por defecto, enviar 'default' para limpiar configuración personal
    if (provider === 'default') {
      setLoading(true);
      try {
        await updateAISettings({
          llm_provider: 'default',
          llm_model: 'default',
        });

        Alert.alert('Éxito', 'Configuración restablecida a modelo por defecto del sistema 🌙');

        if (user) {
          updateUser({
            ...user,
            llm_provider: undefined,
            llm_model: undefined,
          });
        }

        if (loadProfile) loadProfile();
      } catch (error) {
        console.error('Error saving AI settings:', error);
        Alert.alert('Error', 'No se pudo restablecer la configuración');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Configuración personalizada
    if (!provider || !model) {
      Alert.alert('Error', 'Por favor selecciona un proveedor y un modelo');
      return;
    }

    setLoading(true);
    try {
      await updateAISettings({
        llm_provider: provider,
        llm_model: model,
        llm_api_key: apiKey || undefined,
      });

      Alert.alert('Éxito', 'Configuración de LÚA actualizada correctamente 🌙');
      setApiKey('');

      if (user) {
        updateUser({
          ...user,
          llm_provider: provider as any,
          llm_model: model,
        });
      }

      if (loadProfile) loadProfile();
    } catch (error) {
      console.error('Error saving AI settings:', error);
      Alert.alert('Error', 'No se pudo guardar la configuración de IA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          🧠 Motor de Inteligencia LÚA
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Personaliza el comportamiento y el modelo que utiliza tu asistente virtual
        </Text>
      </View>

      {/* Proveedor */}
      <Card variant="elevated" padding="md" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>🌐 Proveedor de IA</Text>

        <TouchableOpacity
          style={[
            styles.providerOption,
            provider === 'default' && { borderColor: theme.colors.primary, borderWidth: 2 },
          ]}
          onPress={() => setProvider('default')}
        >
          <Text style={[styles.providerName, { color: theme.colors.text }]}>
            ⚙️ Por defecto
          </Text>
          <Text style={[styles.providerDesc, { color: theme.colors.textSecondary }]}>
            Usa OpenRouter gratuito configurado en el servidor. Ideal para probar la plataforma sin
            costo.
            <Text style={styles.highlight}> Puede tener intermitencias.</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.providerOption,
            provider === 'openrouter' && { borderColor: theme.colors.primary, borderWidth: 2 },
          ]}
          onPress={() => setProvider('openrouter')}
        >
          <Text style={[styles.providerName, { color: theme.colors.text }]}>OpenRouter</Text>
          <Text style={[styles.providerDesc, { color: theme.colors.textSecondary }]}>
            Accede a cientos de modelos (Claude, Llama, Mistral, etc). Requiere tu propia API key.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.providerOption,
            provider === 'openai' && { borderColor: theme.colors.primary, borderWidth: 2 },
          ]}
          onPress={() => setProvider('openai')}
        >
          <Text style={[styles.providerName, { color: theme.colors.text }]}>OpenAI</Text>
          <Text style={[styles.providerDesc, { color: theme.colors.textSecondary }]}>
            Ideal para una conversación fluida y empática. Requiere API key de pago.
          </Text>
        </TouchableOpacity>

        <View style={[styles.providerOption, styles.disabledOption]}>
          <Text style={[styles.providerName, { color: '#999' }]}>Anthropic (Próximamente)</Text>
        </View>
      </Card>

      {/* Modelo */}
      {provider !== 'default' && (
        <Card variant="elevated" padding="md" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            🤖 Modelo de Lenguaje
          </Text>

          {loadingModels ? (
            <Text style={{ color: theme.colors.textSecondary }}>Cargando modelos...</Text>
          ) : models.length > 0 ? (
            <Select
              label="Selecciona un modelo"
              value={model}
              onChange={setModel}
              options={models.map((m) => ({ label: m.name, value: m.id }))}
              placeholder="Buscar modelo..."
              searchable
              searchPlaceholder="Buscar modelo..."
            />
          ) : (
            <Text style={{ color: theme.colors.textSecondary }}>
              No hay modelos disponibles para este proveedor.
            </Text>
          )}
        </Card>
      )}

      {/* API Key */}
      {provider !== 'default' && (
        <Card variant="elevated" padding="md" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            🔑 API Key Personalizada
          </Text>
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            Ingresa tu clave API del proveedor seleccionado. Esta será encriptada de forma segura.
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="sk-..."
              placeholderTextColor={theme.colors.textSecondary}
              value={apiKey}
              onChangeText={setApiKey}
              secureTextEntry={!showKey}
            />
            <TouchableOpacity onPress={() => setShowKey(!showKey)} style={styles.eyeIcon}>
              <Text>{showKey ? '👁️' : '🕶️'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.note, { color: theme.colors.info }]}>
            💡 Tu API key se guarda encriptada. Solo se usa para conectarse al proveedor.
          </Text>
        </Card>
      )}

      {/* Info del modo por defecto */}
      {provider === 'default' && (
        <Card variant="elevated" padding="md" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            ⚙️ Configuración por Defecto
          </Text>
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            LÚA está configurado para usar el motor gratuito de OpenRouter (modelo Step-3.5 Flash).
            Esta configuración no requiere que proporciones una API key.
          </Text>
          <View style={[styles.warningBox, { backgroundColor: '#FFF3CD', borderColor: '#FFC107' }]}>
            <Text style={[styles.warningText, { color: '#856404' }]}>
              ⚠️ <Text style={styles.warningBold}>Atención:</Text> El modelo gratuito puede
              presentar intermitencias, límites de tasa o indisponibilidad en momentos de alta
              demanda. Para una experiencia más estable, selecciona OpenRouter o OpenAI y
              proporciona tu propia API key.
            </Text>
          </View>
        </Card>
      )}

      {/* Botón Guardar */}
      <Button
        variant="primary"
        title={provider === 'default' ? 'Usar Modelo por Defecto' : 'Guardar Configuración'}
        onPress={handleSaveAISettings}
        loading={loading}
        style={styles.saveButton}
      />

      <Text style={[styles.footerNote, { color: theme.colors.textSecondary }]}>
        {provider === 'default'
          ? 'Al guardar, se restablecerá cualquier configuración personalizada y se usará el motor del sistema.'
          : 'Tu configuración se aplicará solo a tu cuenta. Otros usuarios no se verán afectados.'}
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  header: {
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
  },
  section: {
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  providerOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
    marginBottom: 8,
  },
  providerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  providerDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  highlight: {
    fontWeight: 'bold',
    color: '#FF9800',
  },
  disabledOption: {
    opacity: 0.5,
    backgroundColor: '#eee',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  eyeIcon: {
    marginLeft: -40,
    width: 40,
    alignItems: 'center',
  },
  note: {
    fontSize: 11,
    marginTop: 8,
    fontStyle: 'italic',
  },
  warningBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
  },
  warningText: {
    fontSize: 12,
    lineHeight: 16,
  },
  warningBold: {
    fontWeight: 'bold',
  },
  saveButton: {
    marginTop: 12,
    marginBottom: 30,
  },
  footerNote: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default AISettingsScreen;
