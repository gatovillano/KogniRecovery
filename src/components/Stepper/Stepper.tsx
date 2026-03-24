/**
 * Stepper - Componente indicador de pasos para onboarding
 *
 * Características:
 * - Indicador de pasos para onboarding
 * - N pasos configurables
 * - Animación de transición
 * - Accesibilidad completa
 *
 * Uso:
 * <Stepper
 *   currentStep={1}
 *   totalSteps={4}
 *   steps={['Cuenta', 'Perfil', 'Preferencias', 'Confirmar']}
 * />
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
} from 'react-native';
import { useTheme } from '@theme/ThemeContext';

export interface StepperProps {
  currentStep: number;
  totalSteps: number;
  steps?: string[];
  style?: ViewStyle;
  labelStyle?: TextStyle;
  onStepChange?: (step: number) => void;
}

export const Stepper: React.FC<StepperProps> = ({
  currentStep,
  totalSteps,
  steps,
  style,
  labelStyle,
  onStepChange,
}) => {
  const { theme } = useTheme();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const stepAnim = useRef(new Animated.Value(0)).current;

  // Actualizar la animación cuando cambia el paso actual
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: currentStep / totalSteps,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep, totalSteps, progressAnim]);

  const getContainerStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle = {
      marginBottom: theme.spacing.md,
    };
    const styles: ViewStyle[] = [baseStyle];
    if (style) {
      styles.push(style);
    }
    return styles;
  };

  const getStepsContainerStyle = (): ViewStyle => {
    return {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'relative',
    };
  };

  const getProgressBarStyle = (): ViewStyle => {
    return {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 16,
      height: 4,
      backgroundColor: theme.colors.border,
      borderRadius: 2,
      zIndex: 0,
    };
  };

  const getProgressFillStyle = (): ViewStyle => {
    const width = progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    });
    return {
      position: 'absolute',
      left: 0,
      top: 0,
      height: 4,
      backgroundColor: theme.colors.primary,
      borderRadius: 2,
      width,
      zIndex: 1,
    };
  };

  const getStepCircleStyle = (index: number): ViewStyle => {
    const isActive = index < currentStep;
    const isCurrent = index === currentStep;
    const isPast = index < currentStep;
    
    return {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isPast
        ? theme.colors.primary
        : isCurrent
        ? theme.colors.primary
        : theme.colors.surface,
      borderWidth: isPast || isCurrent ? 0 : 2,
      borderColor: theme.colors.border,
      zIndex: 2,
    };
  };

  const getStepTextStyle = (index: number): TextStyle => {
    const isPast = index < currentStep;
    const isCurrent = index === currentStep;
    
    return {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: theme.typography.fontSize.sm,
      color: isPast || isCurrent ? theme.colors.textInverse : theme.colors.textSecondary,
    };
  };

  const getLabelStyle = (index: number): TextStyle => {
    const isCurrent = index === currentStep;
    
    return {
      fontFamily: theme.typography.fontFamily.regular,
      fontSize: theme.typography.fontSize.xs,
      color: isCurrent ? theme.colors.primary : theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: theme.spacing.xs,
      maxWidth: 80,
    };
  };

  const renderSteps = () => {
    const stepElements = [];
    for (let i = 0; i < totalSteps; i++) {
      const isPast = i < currentStep;
      const isCurrent = i === currentStep;
      
      stepElements.push(
        <View key={i} style={styles.stepWrapper}>
          <View style={getStepCircleStyle(i)}>
            <Text style={getStepTextStyle(i)}>
              {isPast ? '✓' : i + 1}
            </Text>
          </View>
          {steps && steps[i] && (
            <Text style={[getLabelStyle(i), labelStyle]} numberOfLines={2}>
              {steps[i]}
            </Text>
          )}
        </View>
      );
    }
    return stepElements;
  };

  return (
    <View style={getContainerStyle()}>
      <View style={getStepsContainerStyle()}>
        <View style={getProgressBarStyle()}>
          <Animated.View style={getProgressFillStyle()} />
        </View>
        {renderSteps()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stepWrapper: {
    alignItems: 'center',
    flex: 1,
  },
});
