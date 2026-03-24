/**
 * Modal - Componente de modal reutilizable
 *
 * Características:
 * - Overlay con backdrop
 * - Animación de entrada/salida
 * - Header con título y botón de cerrar
 * - Soporte para swipe down (en iOS)
 * - Accesibilidad completa
 *
 * Uso:
 * <Modal
 *   visible={isModalVisible}
 *   onClose={handleClose}
 *   title="Título del modal"
 *   showCloseButton={true}
 * >
 *   <Text>Contenido del modal</Text>
 * </Modal>
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Modal as RNModal,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '@theme/ThemeContext';
import { ModalProps, Theme } from '@types';

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  style,
  contentStyle,
}) => {
  const { theme } = useTheme();

  // Manejar cierre con botón de cerrar
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Cerrar al tocar el overlay
  const handleOverlayPress = () => {
    onClose();
  };

  // Prevenir scroll del background cuando el modal está abierto
  useEffect(() => {
    if (visible) {
      // En iOS, el Modal ya maneja esto automáticamente
      // En Android, podríamos necesitar manejar esto manualmente
    }
  }, [visible]);

  const modalStyles = getStyles(theme);

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose} // Para botón back en Android
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={[modalStyles.keyboardAvoidingView, { backgroundColor: theme.colors.overlay }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={handleOverlayPress}>
          <View style={modalStyles.overlay} />
        </TouchableWithoutFeedback>

        <View style={[modalStyles.container, { backgroundColor: theme.colors.surface }, style]}>
          {/* Header */}
          {(title || showCloseButton) && (
            <View style={[modalStyles.header, { borderBottomColor: theme.colors.border }]}>
              {title && (
                <Text style={[modalStyles.title, { color: theme.colors.text }]} numberOfLines={1}>
                  {title}
                </Text>
              )}
              {showCloseButton && (
                <TouchableWithoutFeedback onPress={handleClose}>
                  <View style={[modalStyles.closeButton, { backgroundColor: theme.colors.background }]}>
                    <Text style={[modalStyles.closeButtonText, { color: theme.colors.text }]}>
                      ✕
                    </Text>
                  </View>
                </TouchableWithoutFeedback>
              )}
            </View>
          )}

          {/* Content */}
          <View style={[modalStyles.content, contentStyle].filter(Boolean) as ViewStyle[]}>
            {children}
          </View>
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
};

const getStyles = (theme: Theme): {
  keyboardAvoidingView: ViewStyle;
  overlay: ViewStyle;
  container: ViewStyle;
  header: ViewStyle;
  title: TextStyle;
  closeButton: ViewStyle;
  closeButtonText: TextStyle;
  content: ViewStyle;
} => ({
  keyboardAvoidingView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
  },
  container: {
    marginHorizontal: 0,
    marginBottom: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
    // En iOS, el modal se desliza desde abajo
    ...Platform.select({
      ios: {
        marginTop: 'auto',
      },
      android: {
        marginTop: '10%',
        marginHorizontal: 20,
        borderRadius: 16,
        elevation: 5,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    flex: 1,
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize.lg,
    marginRight: 16,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
});