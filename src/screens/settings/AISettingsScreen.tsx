/**
 * AISettingsScreen - Pantalla de configuración del motor de IA (LÚA)
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, TouchableOpacity } from 'react-native';
import { useTheme } from '@theme/ThemeContext';
import { Card, Button } from '@components';
import { api, updateAISettings } from '@services/api';
import { useProfile } from '@hooks/useProfile';
import { useAuth } from '@hooks/useAuth';

export const AISettingsScreen: React.FC = () => {
    const { theme } = useTheme();
    const { profile, loadProfile } = useProfile();
    const { user, updateUser } = useAuth();

    const [provider, setProvider] = useState(user?.llm_provider || 'openai');
    const [model, setModel] = useState(user?.llm_model || 'gpt-4');
    const [apiKey, setApiKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [showKey, setShowKey] = useState(false);
    const [models, setModels] = useState<{ id: string, name: string }[]>([]);
    const [loadingModels, setLoadingModels] = useState(false);

    useEffect(() => {
        const fetchModels = async () => {
            setLoadingModels(true);
            try {
                const response = await api.getAIModels(provider);
                if (response.success && response.data) {
                    setModels(response.data);
                    // Si el modelo actual no está en la lista y no es el que ya tenemos del usuario, seleccionar el primero
                    const currentModelInList = response.data.find((m: any) => m.id === model);
                    if (!currentModelInList && response.data.length > 0 && !user?.llm_model) {
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
        // Intentar cargar configuración actual si el backend la devuelve
        if (user) {
            if (user.llm_provider) setProvider(user.llm_provider);
            if (user.llm_model) setModel(user.llm_model);
            // La API Key no la mostramos por seguridad, se queda vacía a menos que se quiera cambiar
        }
    }, [user]);

    const handleSaveAISettings = async () => {
        if (!provider || !model) {
            Alert.alert('Error', 'Por favor selecciona un proveedor y un modelo');
            return;
        }

        setLoading(true);
        try {
            await updateAISettings({
                llm_provider: provider,
                llm_model: model,
                llm_api_key: apiKey || undefined // Solo enviar si no está vacía
            });

            Alert.alert('Éxito', 'Configuración de LÚA actualizada correctamente 🌙');
            setApiKey(''); // Limpiar el campo para seguridad
            
            // Actualizar estado local del usuario
            if (user) {
                updateUser({
                    ...user,
                    llm_provider: provider as any,
                    llm_model: model
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
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    🌐 Proveedor de IA
                </Text>

                <TouchableOpacity
                    style={[styles.providerOption, provider === 'openai' && { borderColor: theme.colors.primary, borderWidth: 2 }]}
                    onPress={() => setProvider('openai')}
                >
                    <Text style={[styles.providerName, { color: theme.colors.text }]}>OpenAI</Text>
                    <Text style={[styles.providerDesc, { color: theme.colors.textSecondary }]}>
                        Ideal para una conversación fluida y empática.
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.providerOption, provider === 'openrouter' && { borderColor: theme.colors.primary, borderWidth: 2 }]}
                    onPress={() => setProvider('openrouter')}
                >
                    <Text style={[styles.providerName, { color: theme.colors.text }]}>OpenRouter</Text>
                    <Text style={[styles.providerDesc, { color: theme.colors.textSecondary }]}>
                        Accede a cientos de modelos (Claude, Llama, Mistral, etc).
                    </Text>
                </TouchableOpacity>

                <View style={[styles.providerOption, styles.disabledOption]}>
                    <Text style={[styles.providerName, { color: '#999' }]}>Anthropic (Próximamente)</Text>
                </View>
            </Card>

            {/* Modelo */}
            <Card variant="elevated" padding="md" style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    🤖 Modelo de Lenguaje
                </Text>

                {loadingModels ? (
                    <Text style={{ color: theme.colors.textSecondary }}>Cargando modelos...</Text>
                ) : (
                    models.length > 0 ? (
                        models.map((m) => (
                            <TouchableOpacity
                                key={m.id}
                                style={styles.modelRow}
                                onPress={() => setModel(m.id)}
                            >
                                <View style={[styles.radio, model === m.id && { backgroundColor: theme.colors.primary }]} />
                                <Text style={[styles.modelName, { color: theme.colors.text }]} numberOfLines={1}>{m.name}</Text>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <Text style={{ color: theme.colors.textSecondary }}>No hay modelos disponibles para este proveedor.</Text>
                    )
                )}
            </Card>

            {/* Credenciales */}
            <Card variant="elevated" padding="md" style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    🔑 API Key Personalizada
                </Text>
                <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
                    Para usar tu propia cuenta, ingresa tu clave API. Esta será encriptada de forma segura en nuestros servidores.
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
                    💡 Si dejas este campo vacío, se usará la clave predeterminada del sistema.
                </Text>
            </Card>

            {/* Botón Guardar */}
            <Button
                variant="primary"
                title="Guardar Configuración"
                onPress={handleSaveAISettings}
                loading={loading}
                style={styles.saveButton}
            />
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
    },
    providerDesc: {
        fontSize: 12,
    },
    disabledOption: {
        opacity: 0.5,
        backgroundColor: '#eee',
    },
    modelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#EEE',
    },
    radio: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 1,
        borderColor: '#999',
        marginRight: 10,
    },
    modelName: {
        fontSize: 15,
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
    saveButton: {
        marginTop: 12,
        marginBottom: 30,
    },
});

export default AISettingsScreen;
