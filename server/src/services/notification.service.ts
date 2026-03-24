import { query } from '../config/database.js';

export interface PushNotification {
    userId: string;
    title: string;
    body: string;
    data?: any;
}

export interface SMSNotification {
    to: string;
    message: string;
}

class NotificationService {
    /**
     * Envía una notificación Push al usuario
     * En producción usaría Firebase Cloud Messaging (FCM) o Expo Push
     */
    async sendPush(notification: PushNotification): Promise<boolean> {
        try {
            console.log(`📱 [PUSH] Enviando a ${notification.userId}: ${notification.title} - ${notification.body}`);

            // 1. Obtener tokens del usuario desde la DB
            const result = await query('SELECT push_token FROM user_push_tokens WHERE user_id = $1', [notification.userId]);
            const tokens = result.rows.map(r => r.push_token);

            if (tokens.length === 0) {
                console.warn(`⚠️ No se encontraron push tokens para el usuario ${notification.userId}`);
                return false;
            }

            // 2. Enviar vía Expo/Firebase (Simulado pero estructurado)
            // await axios.post('https://exp.host/--/api/v2/push/send', {
            //   to: tokens,
            //   title: notification.title,
            //   body: notification.body,
            //   data: notification.data
            // });

            return true;
        } catch (error) {
            console.error('❌ Error enviando push:', error);
            return false;
        }
    }

    /**
     * Envía un mensaje SMS
     * En producción usaría Twilio, AWS SNS o similar
     */
    async sendSMS(sms: SMSNotification): Promise<boolean> {
        try {
            console.log(`💬 [SMS] Enviando a ${sms.to}: ${sms.message}`);

            // Integración típica de Twilio (Simulado):
            // const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
            // await client.messages.create({
            //   body: sms.message,
            //   from: process.env.TWILIO_PHONE,
            //   to: sms.to
            // });

            return true;
        } catch (error) {
            console.error('❌ Error enviando SMS:', error);
            return false;
        }
    }

    /**
     * Notifica a los contactos de emergencia de un usuario
     */
    async notifyEmergencyContacts(userId: string, alertType: string): Promise<void> {
        try {
            // Obtener contactos de emergencia
            const result = await query(`
        SELECT ec.contact_phone, ec.contact_name, u.name as patient_name
        FROM emergency_contacts ec
        JOIN users u ON u.id = ec.user_id
        WHERE ec.user_id = $1 AND ec.is_active = true
      `, [userId]);

            for (const contact of result.rows) {
                await this.sendSMS({
                    to: contact.contact_phone,
                    message: `ALERTA KogniRecovery: Tu contacto ${contact.patient_name} ha activado una alerta de ${alertType}. Por favor, comunícate con él/ella.`
                });
            }
        } catch (error) {
            console.error('❌ Error notificando contactos:', error);
        }
    }
}

export const notificationService = new NotificationService();
export default notificationService;
