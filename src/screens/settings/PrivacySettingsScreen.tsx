/**
 * PrivacySettingsScreen - Pantalla de configuración de privacidad
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { useTheme } from '@theme/ThemeContext';
import { Card, Button } from '@components';
import { useProfile } from '@hooks/useProfile';

export const PrivacySettingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { settings, updateSettings, loading } = useProfile();
  
  const [dataSharingEnabled, setDataSharingEnabled] = useState(false);
  const [shareWithFamily, setShareWithFamily] = useState(false);
  const [shareProgressWeekly, setShareProgressWeekly] = useState(true);
  const [anonymousAnalytics, setAnonymousAnalytics] = useState(true);
  const [shareWithFamilyMembers, setShareWithFamilyMembers] = useState<any[]>([]);

  useEffect(() => {
    if (settings) {
      setDataSharingEnabled(settings.data_sharing_enabled ?? false);
      setShareWithFamily(settings.share_with_family ?? false);
      setShareProgressWeekly(settings.share_progress_weekly ?? true);
      setAnonymousAnalytics(settings.anonymous_analytics ?? true);
    }
  }, [settings]);

  const handleSaveSettings = async () => {
    try {
      await updateSettings({
        data_sharing_enabled: dataSharingEnabled,
        share_with_family: shareWithFamily,
        share_progress_weekly: shareProgressWeekly,
        anonymous_analytics: anonymousAnalytics
      });
      Alert.alert('Éxito', 'Configuración de privacidad guardada');
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la configuración');
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
          🔒 Configuración de Privacidad
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Controla quién puede ver tu información y progreso
        </Text>
      </View>

      {/* Compartir con Familia */}
      <Card variant="elevated" padding="md" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          👨‍👩‍👧 Compartir con Familia
        </Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
              Compartir con familiares
            </Text>
            <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
              Permitir que familiares vean tu progreso
            </Text>
          </View>
          <Switch
            value={shareWithFamily}
            onValueChange={setShareWithFamily}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          />
        </View>

        {shareWithFamily && (
          <>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                  Compartir progreso semanal
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  Enviar resumen semanal de tu progreso
                </Text>
              </View>
              <Switch
                value={shareProgressWeekly}
                onValueChange={setShareProgressWeekly}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              />
            </View>

            {/* Miembros de familia */}
            {shareWithFamilyMembers.length > 0 ? (
              <View style={styles.familyMembers}>
                <Text style={[styles.familyMembersTitle, { color: theme.colors.text }]}>
                  Familiares con acceso:
                </Text>
                {shareWithFamilyMembers.map((member) => (
                  <View key={member.id} style={styles.familyMember}>
                    <Text style={[styles.memberName, { color: theme.colors.text }]}>
                      {member.name}
                    </Text>
                    <Text style={[styles.memberEmail, { color: theme.colors.textSecondary }]}>
                      {member.email}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noMembers}>
                <Text style={[styles.noMembersText, { color: theme.colors.textSecondary }]}>
                  No has agregado familiares aún
                </Text>
              </View>
            )}
          </>
        )}
      </Card>

      {/* Compartir Datos */}
      <Card variant="elevated" padding="md" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          📊 Compartir Datos
        </Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
              Habilitar compartición de datos
            </Text>
            <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
              Permitir compartir datos anónimos para investigación
            </Text>
          </View>
          <Switch
            value={dataSharingEnabled}
            onValueChange={setDataSharingEnabled}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
              Analíticas anónimas
            </Text>
            <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
              Ayudar a mejorar la app con datos anónimos
            </Text>
          </View>
          <Switch
            value={anonymousAnalytics}
            onValueChange={setAnonymousAnalytics}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          />
        </View>
      </Card>

      {/* Información de Privacidad */}
      <Card variant="outlined" padding="md" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          ℹ️ Tu Privacidad es Importante
        </Text>
        
        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          En KogniRecovery nos comprometemos a proteger tu privacidad:
        </Text>
        
        <View style={styles.privacyList}>
          <Text style={[styles.privacyItem, { color: theme.colors.text }]}>
            ✓ Tus datos están encriptados
          </Text>
          <Text style={[styles.privacyItem, { color: theme.colors.text }]}>
            ✓ No vendemos tu información
          </Text>
          <Text style={[styles.privacyItem, { color: theme.colors.text }]}>
            ✓ Puedes eliminar tus datos en cualquier momento
          </Text>
          <Text style={[styles.privacyItem, { color: theme.colors.text }]}>
            ✓ Tienes control total sobre lo que compartes
          </Text>
        </View>
      </Card>

      {/* Opciones Adicionales */}
      <Card variant="elevated" padding="md" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          ⚙️ Opciones Adicionales
        </Text>
        
        <Button
          variant="secondary"
          onPress={() => Alert.alert('Información', 'Esta función estará disponible pronto')}
          style={styles.optionButton}
        >
          📥 Descargar mis datos
        </Button>
        
        <Button
          variant="secondary"
          onPress={() => Alert.alert(
            'Eliminar cuenta',
            '¿Estás seguro de que quieres eliminar tu cuenta? Esta acción es irreversible.',
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Eliminar', style: 'destructive', onPress: () => {} }
            ]
          )}
          textStyle={{ color: theme.colors.error }}
          style={[styles.optionButton, { borderColor: theme.colors.error }]}
        >
          🗑️ Eliminar mi cuenta
        </Button>
      </Card>

      {/* Botón Guardar */}
      <Button
        variant="primary"
        onPress={handleSaveSettings}
        loading={loading}
        style={styles.saveButton}
      >
        Guardar Configuración
      </Button>
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
  section: {},
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  familyMembers: {
    marginTop: 16,
  },
  familyMembersTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  familyMember: {
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 8,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '500',
  },
  memberEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  noMembers: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
  },
  noMembersText: {
    textAlign: 'center',
    fontSize: 14,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 12,
  },
  privacyList: {
    gap: 8,
  },
  privacyItem: {
    fontSize: 14,
    marginBottom: 4,
  },
  optionButton: {
    marginBottom: 12,
  },
  saveButton: {
    marginTop: 8,
  },
});

export default PrivacySettingsScreen;
