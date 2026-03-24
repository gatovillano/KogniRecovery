/**
 * EmergencySettingsScreen - Pantalla de configuración de emergencia
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { useTheme } from '@theme/ThemeContext';
import { Card, Button, Input } from '@components';
import { useProfile } from '@hooks/useProfile';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  is_primary: boolean;
}

export const EmergencySettingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { settings, updateSettings, loading } = useProfile();
  
  const [autoDetectCrisis, setAutoDetectCrisis] = useState(true);
  const [emergencyContactsNotified, setEmergencyContactsNotified] = useState(true);
  const [locationSharing, setLocationSharing] = useState(false);
  const [crisisLine, setCrisisLine] = useState('141');
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [newContact, setNewContact] = useState({ name: '', phone: '', relationship: '' });

  useEffect(() => {
    if (settings) {
      setAutoDetectCrisis(settings.auto_detect_crisis ?? true);
      setEmergencyContactsNotified(settings.emergency_contacts_notified ?? true);
      setLocationSharing(settings.location_sharing_emergency ?? false);
    }
  }, [settings]);

  const handleSaveSettings = async () => {
    try {
      await updateSettings({
        auto_detect_crisis: autoDetectCrisis,
        emergency_contacts_notified: emergencyContactsNotified,
        location_sharing_emergency: locationSharing
      });
      Alert.alert('Éxito', 'Configuración de emergencia guardada');
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la configuración');
    }
  };

  const handleAddContact = () => {
    if (!newContact.name || !newContact.phone) {
      Alert.alert('Error', 'Por favor completa el nombre y teléfono');
      return;
    }

    const contact: EmergencyContact = {
      id: Date.now().toString(),
      ...newContact,
      is_primary: emergencyContacts.length === 0
    };

    setEmergencyContacts([...emergencyContacts, contact]);
    setNewContact({ name: '', phone: '', relationship: '' });
  };

  const handleRemoveContact = (id: string) => {
    setEmergencyContacts(emergencyContacts.filter(c => c.id !== id));
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          🚨 Configuración de Emergencia
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Configura cómo quieres que NADA te ayude en situaciones de crisis
        </Text>
      </View>

      {/* Detección Automática de Crisis */}
      <Card variant="elevated" padding="md" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Detección Automática
        </Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
              Detectar situaciones de crisis
            </Text>
            <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
              NADA analizará tus mensajes para detectar posibles crisis
            </Text>
          </View>
          <Switch
            value={autoDetectCrisis}
            onValueChange={setAutoDetectCrisis}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
              Notificar a contactos de emergencia
            </Text>
            <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
              Enviar alerta a tus contactos cuando se detecte una crisis
            </Text>
          </View>
          <Switch
            value={emergencyContactsNotified}
            onValueChange={setEmergencyContactsNotified}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
              Compartir ubicación en emergencias
            </Text>
            <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
              Compartir tu ubicación con servicios de emergencia
            </Text>
          </View>
          <Switch
            value={locationSharing}
            onValueChange={setLocationSharing}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          />
        </View>
      </Card>

      {/* Línea de Crisis */}
      <Card variant="elevated" padding="md" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          📞 Línea de Crisis
        </Text>
        
        <Input
          label="Número de línea de crisis"
          value={crisisLine}
          onChangeText={setCrisisLine}
          placeholder="Ej: 141"
          keyboardType="phone-pad"
        />
        
        <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>
          En Chile: 141 (Fono Vida)
        </Text>
      </Card>

      {/* Contactos de Emergencia */}
      <Card variant="elevated" padding="md" style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          👥 Contactos de Emergencia
        </Text>
        
        {emergencyContacts.map((contact) => (
          <View 
            key={contact.id} 
            style={[styles.contactCard, { backgroundColor: theme.colors.surface }]}
          >
            <View style={styles.contactInfo}>
              <Text style={[styles.contactName, { color: theme.colors.text }]}>
                {contact.name}
                {contact.is_primary && <Text style={{ color: theme.colors.primary }}> (Principal)</Text>}
              </Text>
              <Text style={[styles.contactPhone, { color: theme.colors.textSecondary }]}>
                {contact.phone}
              </Text>
              <Text style={[styles.contactRelationship, { color: theme.colors.textSecondary }]}>
                {contact.relationship}
              </Text>
            </View>
            <Button
              variant="text"
              onPress={() => handleRemoveContact(contact.id)}
              textStyle={{ color: theme.colors.error }}
            >
              Eliminar
            </Button>
          </View>
        ))}

        {/* Agregar nuevo contacto */}
        <View style={styles.addContactForm}>
          <Text style={[styles.addContactTitle, { color: theme.colors.text }]}>
            Agregar Contacto
          </Text>
          <Input
            label="Nombre"
            value={newContact.name}
            onChangeText={(text) => setNewContact({ ...newContact, name: text })}
            placeholder="Nombre completo"
          />
          <Input
            label="Teléfono"
            value={newContact.phone}
            onChangeText={(text) => setNewContact({ ...newContact, phone: text })}
            placeholder="+56 9 XXXX XXXX"
            keyboardType="phone-pad"
          />
          <Input
            label="Relación"
            value={newContact.relationship}
            onChangeText={(text) => setNewContact({ ...newContact, relationship: text })}
            placeholder="Ej: Esposa, Hermano, Amigo"
          />
          <Button
            variant="secondary"
            onPress={handleAddContact}
            style={styles.addButton}
          >
            + Agregar Contacto
          </Button>
        </View>
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

      {/* Información de Emergencia */}
      <Card variant="outlined" padding="md" style={styles.infoCard}>
        <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
          ℹ️ En caso de emergencia
        </Text>
        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          Si tú o alguien que conoces está en peligro inmediato, por favor:
        </Text>
        <Text style={[styles.infoBullet, { color: theme.colors.textSecondary }]}>
          • Llama al 141 (Fono Vida Chile){'\n'}
          • Llama al 131 (SAMU){'\n'}
          • Llama al 132 (Bomberos){'\n'}
          • Ve al servicio de urgencia más cercano
        </Text>
      </Card>
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
  helpText: {
    fontSize: 12,
    marginTop: 8,
  },
  contactCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
  },
  contactPhone: {
    fontSize: 14,
    marginTop: 2,
  },
  contactRelationship: {
    fontSize: 12,
    marginTop: 2,
  },
  addContactForm: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E0E0',
  },
  addContactTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  addButton: {
    marginTop: 12,
  },
  saveButton: {
    marginTop: 8,
  },
  infoCard: {
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 8,
  },
  infoBullet: {
    fontSize: 14,
    lineHeight: 22,
  },
});

export default EmergencySettingsScreen;
