/**
 * Servicio de Alertas de Interacción de Medicamentos
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 * Sprint 3: Sistema de Alertas
 */

import { neo4jService } from './neo4j.service.js';
import { notificationService } from './notification.service.js';

// =====================================================
// TIPOS E INTERFACES
// =====================================================

export interface DrugInteraction {
  id: string;
  drug1: string;
  drug2: string;
  severity: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
  risk: 'minima' | 'moderada' | 'peligrosa' | 'potencialmente letal';
  description: string;
  mechanism: string;
  symptoms: string[];
  recommendations: string[];
  references: string[];
}

export interface SubstanceInteraction {
  id: string;
  substance: string;
  drug: string;
  severity: number;
  risk: string;
  description: string;
  recommendations: string[];
  references?: string[];
}

export interface Alert {
  id: string;
  type: 'interaction' | 'substance_drug' | 'emergency';
  severity: number;
  risk: string;
  title: string;
  description: string;
  recommendations: string[];
  timestamp: Date;
  acknowledged: boolean;
  userId: string;
  sustancia?: string;
  medicamento?: string;
}

export enum AlertProtocol {
  EMERGENCY = 'emergency',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info',
}

// =====================================================
// BASE DE CONOCIMIENTOS DE INTERACCIONES
// =====================================================

const KNOWN_DRUG_INTERACTIONS: DrugInteraction[] = [
  {
    id: '1',
    drug1: 'oxicodona',
    drug2: 'alcohol',
    severity: 10,
    risk: 'potencialmente letal',
    description: 'La combinación de opioides y alcohol puede causar depresión respiratoria severa, pérdida de conciencia y muerte.',
    mechanism: 'Efecto sinérgico sobre el sistema nervioso central',
    symptoms: ['respiración lenta', 'piel fría y húmeda', 'pupilas pequeñas', 'pérdida de conciencia'],
    recommendations: ['Evitar completamente la combinación', 'Si hay síntomas, llamar a emergencias inmediatamente'],
    references: ['FDA', 'NIH']
  },
  {
    id: '2',
    drug1: 'benzodiacepina',
    drug2: 'alcohol',
    severity: 9,
    risk: 'potencialmente letal',
    description: 'La combinación aumenta significativamente el riesgo de depresión respiratoria, sedación excesiva y muerte.',
    mechanism: 'Efecto aditivo sobre receptores GABA',
    symptoms: ['sedación extrema', 'confusión', 'respiración lenta', 'coma'],
    recommendations: ['Evitar completamente', 'No conducir', 'No operar maquinaria'],
    references: ['FDA', 'SAMHSA']
  },
  {
    id: '3',
    drug1: 'metadona',
    drug2: 'benzodiacepina',
    severity: 9,
    risk: 'potencialmente letal',
    description: 'Riesgo elevado de muerte por depresión respiratoria.',
    mechanism: 'Efecto sinérgico sobre sistema nervioso central',
    symptoms: ['mareo', 'confusión', 'respiración depresiva'],
    recommendations: ['Evitar si es posible', 'Si necesario, bajo supervisión médica'],
    references: ['CDC']
  },
  {
    id: '4',
    drug1: 'cocaína',
    drug2: 'alcohol',
    severity: 7,
    risk: 'peligrosa',
    description: 'Formación de cocaetileno, metabolito cardiotóxico que aumenta riesgo de muerte súbita.',
    mechanism: 'Metabolismo hepático competitivo',
    symptoms: ['dolor torácico', 'arritmia', 'hipertensión severa'],
    recommendations: ['Evitar combinación', 'Hidratarse', 'No mezclar en misma sesión'],
    references: ['NIDA']
  },
  {
    id: '5',
    drug1: 'metanfetamina',
    drug2: 'alcohol',
    severity: 7,
    risk: 'peligrosa',
    description: 'Efectos contrapuestos pueden llevar a sobredosis inadvertida.',
    mechanism: 'Deshidrogenación del alcohol',
    symptoms: ['náuseas', 'vómitos', 'mareo', 'psicosis'],
    recommendations: ['Evitar combinación', 'Esperar mínimo 6 horas entre consumo'],
    references: ['NIDA']
  },
  {
    id: '6',
    drug1: 'viagra',
    drug2: 'nitroglicerina',
    severity: 10,
    risk: 'potencialmente letal',
    description: 'Caída masiva de presión arterial potencialmente mortal.',
    mechanism: 'Vasodilatación sinérgica',
    symptoms: ['mareo', 'desmayo', 'dolor torácico'],
    recommendations: ['No combinar', 'Consultar médico'],
    references: ['FDA']
  },
  {
    id: '7',
    drug1: 'tramadol',
    drug2: 'alcohol',
    severity: 8,
    risk: 'peligrosa',
    description: 'Aumenta el riesgo de efectos secundarios del tramadol y depresión respiratoria.',
    mechanism: 'Efecto sinérgico sobre el sistema nervioso central',
    symptoms: ['mareo', 'somnolencia', 'dificultad respiratoria'],
    recommendations: ['Evitar combinación', 'No conducir'],
    references: ['FDA']
  },
  {
    id: '8',
    drug1: 'ketamina',
    drug2: 'alcohol',
    severity: 8,
    risk: 'peligrosa',
    description: 'Efectos相加 pueden causar pérdida de conocimiento y depresión respiratoria.',
    mechanism: 'Efecto sinérgico sobre el sistema nervioso central',
    symptoms: ['náuseas', 'vómitos', 'pérdida de coordinación', 'confusión'],
    recommendations: ['Evitar combinación', 'Si se mezcla, no conducir'],
    references: ['NIDA']
  },
];

const KNOWN_SUBSTANCE_INTERACTIONS: SubstanceInteraction[] = [
  {
    id: 's1',
    substance: 'alcohol',
    drug: 'paracetamol',
    severity: 5,
    risk: 'moderada',
    description: 'Consumo excesivo de alcohol con paracetamol aumenta riesgo de daño hepático.',
    recommendations: ['Dosis máxima: 3g/día si bebe regularmente', 'Evitar binge drinking'],
    references: ['FDA']
  },
  {
    id: 's2',
    substance: 'alcohol',
    drug: 'ibuprofeno',
    severity: 3,
    risk: 'minima',
    description: 'Aumenta riesgo de irritación gástrica.',
    recommendations: ['Tomar con comida', 'Evitar si hay historial úlcera']
  },
  {
    id: 's3',
    substance: 'alcohol',
    drug: 'warfarina',
    severity: 8,
    risk: 'peligrosa',
    description: 'Alcohol altera metabolismo de warfarina, aumentando riesgo de sangrado.',
    recommendations: ['Evitar alcohol o limitar severamente', 'Monitoreo de INR frecuente'],
    references: ['FDA']
  },
  {
    id: 's4',
    substance: 'cannabis',
    drug: 'warfarina',
    severity: 6,
    risk: 'moderada',
    description: 'Puede aumentar efecto anticoagulante.',
    recommendations: ['Monitoreo de INR', 'Informar al médico'],
    references: ['FDA']
  },
  {
    id: 's5',
    substance: 'alcohol',
    drug: 'antidepresivo',
    severity: 7,
    risk: 'peligrosa',
    description: 'Puede aumentar efectos sedantes y riesgo de sobredosis.',
    recommendations: ['Evitar alcohol con antidepresivos', 'Consultar al médico'],
    references: ['SAMHSA']
  },
  {
    id: 's6',
    substance: 'alcohol',
    drug: 'ansiolitico',
    severity: 9,
    risk: 'potencialmente letal',
    description: 'Efecto sedante相加 extremadamente peligroso.',
    recommendations: ['Evitar completamente', 'No operar maquinaria'],
    references: ['FDA']
  },
  {
    id: 's7',
    substance: 'cannabis',
    drug: 'sedante',
    severity: 6,
    risk: 'moderada',
    description: 'Aumenta efectos sedantes.',
    recommendations: ['Reducir dosis si es necesario', 'No conducir'],
    references: ['NIDA']
  },
  {
    id: 's8',
    substance: 'opioide',
    drug: 'benzodiacepina',
    severity: 10,
    risk: 'potencialmente letal',
    description: 'Riesgo extremo de depresión respiratoria y muerte.',
    recommendations: ['Evitar combinación si es posible', 'Si necesario, bajo supervisión médica estricta'],
    references: ['FDA', 'CDC']
  },
];

// =====================================================
// SERVICIO DE INTERACCIONES
// =====================================================

class InteractionsService {
  private interactions: DrugInteraction[];
  private substanceInteractions: SubstanceInteraction[];

  constructor() {
    this.interactions = [...KNOWN_DRUG_INTERACTIONS];
    this.substanceInteractions = [...KNOWN_SUBSTANCE_INTERACTIONS];
  }

  /**
   * Verifica interacción entre dos drogas
   */
  checkInteraction(drug1: string, drug2: string): DrugInteraction | null {
    const d1 = drug1.toLowerCase();
    const d2 = drug2.toLowerCase();

    return this.interactions.find(i =>
      (i.drug1 === d1 && i.drug2 === d2) ||
      (i.drug1 === d2 && i.drug2 === d1)
    ) || null;
  }

  /**
   * Verifica interacción entre sustancia y droga
   */
  checkSubstanceInteraction(substance: string, drug: string): SubstanceInteraction | null {
    const s = substance.toLowerCase();
    const d = drug.toLowerCase();

    return this.substanceInteractions.find(i =>
      (i.substance === s && i.drug.includes(d)) ||
      (i.drug === d && i.substance.includes(s)) ||
      (i.substance === s && d.includes(i.drug)) ||
      (i.drug === d && s.includes(i.substance))
    ) || null;
  }

  /**
   * Obtiene todas las interacciones para una droga
   */
  getAllInteractionsForDrug(drug: string): (DrugInteraction | SubstanceInteraction)[] {
    const d = drug.toLowerCase();
    const results: (DrugInteraction | SubstanceInteraction)[] = [];

    // Interacciones droga-droga
    results.push(...this.interactions.filter(i =>
      i.drug1.includes(d) || i.drug2.includes(d)
    ));

    // Interacciones sustancia-medicamento
    results.push(...this.substanceInteractions.filter(i =>
      i.drug.includes(d) || d.includes(i.drug)
    ));

    return results;
  }

  /**
   * Obtiene interacciones para una sustancia
   */
  getInteractionsForSubstance(substance: string): SubstanceInteraction[] {
    const s = substance.toLowerCase();
    return this.substanceInteractions.filter(i =>
      i.substance.includes(s) || s.includes(i.substance)
    );
  }

  /**
   * Agrega una nueva interacción (para futuras expansiones)
   */
  addInteraction(interaction: DrugInteraction | SubstanceInteraction): void {
    if ('drug1' in interaction) {
      this.interactions.push(interaction);
    } else {
      this.substanceInteractions.push(interaction);
    }
  }
}

// =====================================================
// SERVICIO DE DETECCIÓN DE ALERTAS
// =====================================================

class AlertDetectorService {
  private interactions: InteractionsService;

  constructor() {
    this.interactions = new InteractionsService();
  }

  /**
   * Verifica las interacciones del usuario
   */
  async checkUserInteractions(userId: string): Promise<Alert[]> {
    const alerts: Alert[] = [];

    try {
      // Obtener sustancias y medicamentos del usuario desde Neo4j
      const userSubstances = await neo4jService.getUserSubstances(userId);
      const userMedications = await neo4jService.getUserMedications(userId);

      const sustancias = userSubstances[0]?.sustancias || [];
      const medicamentos = userMedications[0]?.medicamentos || [];

      // Verificar interacciones sustancia-sustancia
      for (let i = 0; i < sustancias.length; i++) {
        for (let j = i + 1; j < sustancias.length; j++) {
          const interaction = this.interactions.checkInteraction(
            sustancias[i]?.nombre || sustancias[i],
            sustancias[j]?.nombre || sustancias[j]
          );

          if (interaction && interaction.severity >= 7) {
            alerts.push(this.createAlert(userId, interaction));
          }
        }
      }

      // Verificar interacciones sustancia-medicamento
      for (const sustancia of sustancias) {
        const sustName = sustancia?.nombre || sustancia;
        for (const medicamento of medicamentos) {
          const medName = medicamento?.nombre || medicamento;

          const interaction = this.interactions.checkSubstanceInteraction(sustName, medName);

          if (interaction && interaction.severity >= 5) {
            alerts.push(this.createSubstanceDrugAlert(userId, sustName, medName, interaction));
          }
        }
      }

      // Guardar alertas y procesar
      if (alerts.length > 0) {
        await this.processAlerts(userId, alerts);
      }

      return alerts;
    } catch (error) {
      console.error('❌ Error checking user interactions:', error);
      return [];
    }
  }

  /**
   * Verifica interacciones al registrar un check-in
   */
  async checkOnCheckIn(
    userId: string,
    checkInData: {
      consumo: boolean;
      sustancia?: string;
      cantidad?: number;
    }
  ): Promise<Alert[]> {
    const alerts: Alert[] = [];

    if (!checkInData.consumo || !checkInData.sustancia) {
      return alerts;
    }

    try {
      // Obtener medicamentos actuales del usuario
      const userMedications = await neo4jService.getUserMedications(userId);
      const medicamentos = userMedications[0]?.medicamentos || [];

      // Verificar interacción con sustancia registrada
      for (const medicamento of medicamentos) {
        const medName = medicamento?.nombre || medicamento;

        const interaction = this.interactions.checkSubstanceInteraction(
          checkInData.sustancia,
          medName
        );

        if (interaction && interaction.severity >= 5) {
          alerts.push(
            this.createSubstanceDrugAlert(
              userId,
              checkInData.sustancia,
              medName,
              interaction
            )
          );
        }
      }

      // Notificar alertas críticas inmediatamente
      const criticalAlerts = alerts.filter(a => a.severity >= 8);
      if (criticalAlerts.length > 0) {
        await this.sendCriticalNotifications(userId, criticalAlerts);
      }

      return alerts;
    } catch (error) {
      console.error('❌ Error checking interactions on check-in:', error);
      return [];
    }
  }

  /**
   * Crea una alerta de interacción droga-droga
   */
  private createAlert(userId: string, interaction: DrugInteraction): Alert {
    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'interaction',
      severity: interaction.severity,
      risk: interaction.risk,
      title: `Interacción peligrosa: ${interaction.drug1} + ${interaction.drug2}`,
      description: interaction.description,
      recommendations: interaction.recommendations,
      timestamp: new Date(),
      acknowledged: false,
      userId,
      sustancia: interaction.drug1,
      medicamento: interaction.drug2,
    };
  }

  /**
   * Crea una alerta de interacción sustancia-medicamento
   */
  private createSubstanceDrugAlert(
    userId: string,
    sustancia: string,
    medicamento: string,
    interaction: SubstanceInteraction
  ): Alert {
    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'substance_drug',
      severity: interaction.severity,
      risk: interaction.risk,
      title: `Interacción: ${sustancia} + ${medicamento}`,
      description: interaction.description,
      recommendations: interaction.recommendations,
      timestamp: new Date(),
      acknowledged: false,
      userId,
      sustancia,
      medicamento,
    };
  }

  /**
   * Procesa las alertas generadas
   */
  private async processAlerts(userId: string, alerts: Alert[]): Promise<void> {
    // Guardar alertas en Neo4j
    for (const alert of alerts) {
      try {
        await neo4jService.saveAlert({
          userId: alert.userId,
          id: alert.id,
          tipo: alert.type,
          severidad: alert.severity,
          riesgo: alert.risk,
          titulo: alert.title,
          descripcion: alert.description,
          recomendaciones: alert.recommendations,
        });
      } catch (error) {
        console.error('❌ Error saving alert:', error);
      }
    }

    // Notificar alertas severas
    const severeAlerts = alerts.filter(a => a.severity >= 8);
    if (severeAlerts.length > 0) {
      await this.sendCriticalNotifications(userId, severeAlerts);
    }
  }

  /**
   * Envía notificaciones críticas reales a través de Push y SMS
   */
  private async sendCriticalNotifications(userId: string, alerts: Alert[]): Promise<void> {
    try {
      // 1. Log interno de seguridad
      console.log('🚨 [CRÍTICO] Enviando notificaciones reales para:', userId);

      // 2. Enviar Notificación PUSH al usuario
      await notificationService.sendPush({
        userId,
        title: '⚠️ LÚA: Alerta de Seguridad',
        body: `Se han detectado ${alerts.length} interacciones que requieren tu atención inmediata. Verifica ahora.`,
        data: { type: 'alert', alerts: alerts.map(a => a.id) }
      });

      // 3. Si la severidad es extrema (sobredosis, riesgo letal), notificar a contactos de emergencia
      const extremeAlerts = alerts.filter(a => a.severity >= 9);
      if (extremeAlerts.length > 0 && extremeAlerts[0]) {
        console.log('🚑 [EMERGENCIA] Activando protocolo de contactos externos para:', userId);
        await notificationService.notifyEmergencyContacts(userId, extremeAlerts[0].type);
      }
    } catch (error) {
      console.error('❌ Error enviando notificaciones críticas:', error);
    }
  }

  /**
   * Obtiene las alertas no reconocidas del usuario
   */
  async getUnacknowledgedAlerts(userId: string): Promise<Alert[]> {
    try {
      const results = await neo4jService.getUnacknowledgedAlerts(userId);
      return results.map((r: any) => r.a) || [];
    } catch (error) {
      console.error('❌ Error getting unacknowledged alerts:', error);
      return [];
    }
  }

  /**
   * Reconoce una alerta
   */
  async acknowledgeAlert(userId: string, alertId: string): Promise<void> {
    try {
      await neo4jService.acknowledgeAlert(userId, alertId);
    } catch (error) {
      console.error('❌ Error acknowledging alert:', error);
    }
  }
}

// =====================================================
// SERVICIO DE PROTOCOLOS DE ALERTA
// =====================================================

class AlertProtocolService {
  /**
   * Obtiene el protocolo según la severidad
   */
  getProtocolForSeverity(severity: number): AlertProtocol {
    if (severity >= 9) return AlertProtocol.EMERGENCY;
    if (severity >= 7) return AlertProtocol.HIGH;
    if (severity >= 5) return AlertProtocol.MEDIUM;
    if (severity >= 3) return AlertProtocol.LOW;
    return AlertProtocol.INFO;
  }

  /**
   * Obtiene la respuesta según el protocolo
   */
  getResponseForProtocol(
    protocol: AlertProtocol,
    context: {
      sustancia?: string;
      medicamento?: string;
      description?: string;
      recommendations?: string[];
      pais?: string;
    }
  ): string {
    switch (protocol) {
      case AlertProtocol.EMERGENCY:
        return this.getEmergencyResponse(context);
      case AlertProtocol.HIGH:
        return this.getHighRiskResponse(context);
      case AlertProtocol.MEDIUM:
        return this.getMediumRiskResponse(context);
      case AlertProtocol.LOW:
        return this.getLowRiskResponse(context);
      default:
        return this.getInfoResponse(context);
    }
  }

  /**
   * Obtiene la línea de emergencia según el país
   */
  private getEmergencyLine(pais: string): string {
    const lines: Record<string, string> = {
      'AR': '135 (Atención en Adicciones), 911',
      'MX': 'Línea de la Vida 800 911 2000, 911',
      'CL': '1450 (Atención en Adicciones), 131',
      'ES': '024 (suicidio), 112',
      'US': '988, 911',
      'CO': '123, 01 8000 971 800',
      'PE': '113 (SAMU)',
    };
    return lines[pais] || '911';
  }

  private getEmergencyResponse(context: any): string {
    const emergencyLine = this.getEmergencyLine(context.pais);
    return `
🚨 **ALTA PRIORIDAD - RIESGO SEVERO**

La combinación de ${context.sustancia} con ${context.medicamento} puede ser **potencialmente mortal**.

**Acciones recomendadas:**
1. Llama a emergencias **AHORA** (${emergencyLine})
2. No consumas ninguna de las sustancias
3. Si tienes síntomas, busca atención médica inmediata

¿Tienes a alguien cerca que pueda ayudarte? Te acompaño mientras contactas ayuda.
`.trim();
  }

  private getHighRiskResponse(context: any): string {
    return `
⚠️ **ALERTA: Interacción Peligrosa**

He detectado que estás consumiendo ${context.sustancia} junto con ${context.medicamento}.

**Riesgo:** ${context.description}

**Recomendaciones:**
${context.recommendations?.map((r: string) => `- ${r}`).join('\n') || ''}

**Nota:** Esta combinación puede ser peligrosa. ¿Has consultado con tu médico?

Si estás experimentando síntomas graves, contacta a emergencias.
`.trim();
  }

  private getMediumRiskResponse(context: any): string {
    return `
⚡ **Información de Seguridad**

He detectado una interacción entre ${context.sustancia} y ${context.medicamento}.

**Detalles:** ${context.description}

**Recomendaciones:**
${context.recommendations?.map((r: string) => `- ${r}`).join('\n') || ''}

Te recomiendo revisar esto con tu médico en tu próxima cita.
`.trim();
  }

  private getLowRiskResponse(context: any): string {
    return `
ℹ️ **Información**

Nota: La combinación de ${context.sustancia} con ${context.medicamento} puede tener efectos secundarios.

**Consejos:**
${context.recommendations?.map((r: string) => `- ${r}`).join('\n') || ''}
`.trim();
  }

  private getInfoResponse(context: any): string {
    return `
📚 **Información**

${context.description}

¿Te gustaría más información sobre esta sustancia o medicamento?
`.trim();
  }
}

// =====================================================
// EXPORTAR INSTANCIAS
// =====================================================

export const interactionsService = new InteractionsService();
export const alertDetectorService = new AlertDetectorService();
export const alertProtocolService = new AlertProtocolService();

export default {
  interactions: interactionsService,
  detector: alertDetectorService,
  protocol: alertProtocolService,
};
