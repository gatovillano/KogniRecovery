/**
 * TTS Service
 * Maneja la generación de voz a partir de texto
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const TTS_URL = process.env.TTS_API_URL || 'http://localhost:8006';
const DEFAULT_LANGUAGE = 'es';

export interface TTSService {
  generateSpeech(text: string, language?: string, speaker?: string): Promise<Buffer>;
}

/**
 * Limpia caracteres markdown del texto para que no sean leídos por TTS
 */
function cleanMarkdown(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // Eliminar encabezados (# ## ### etc.)
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');

  // Eliminar negrita (**texto** o __texto__)
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
  cleaned = cleaned.replace(/__([^_]+)__/g, '$1');

  // Eliminar cursiva (*texto* o _texto_)
  cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');
  cleaned = cleaned.replace(/_([^_]+)_/g, '$1');

  // Eliminar strikethrough (~~texto~~)
  cleaned = cleaned.replace(/~~([^~]+)~~/g, '$1');

  // Eliminar código inline (`código`)
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');

  // Eliminar bloques de código (```código```)
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '[código]');

  // Eliminar enlaces [texto](url)
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Eliminar imágenes ![alt](url)
  cleaned = cleaned.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');

  // Eliminar citas (> texto)
  cleaned = cleaned.replace(/^>\s+/gm, '');

  // Eliminar separadores (---, ***, ___)
  cleaned = cleaned.replace(/^[-*_]{3,}$/gm, '');

  // Eliminar elementos de lista (* - + o números.)
  cleaned = cleaned.replace(/^\s*[*+-]\s+/gm, '');
  cleaned = cleaned.replace(/^\s*\d+\.\s+/gm, '');

  // Eliminar checkboxes [ ] o [x]
  cleaned = cleaned.replace(/\[[ x]\]/g, '');

  // Eliminar tablas markdown (| | |)
  cleaned = cleaned.replace(/\|/g, ' ');
  cleaned = cleaned.replace(/^[-+|:]+$/gm, '');

  // Limpiar espacios extra y saltos de línea múltiples
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.replace(/\s{2,}/g, ' ');

  return cleaned.trim();
}

export class TTSServiceImpl implements TTSService {
  /**
   * Genera audio a partir de texto usando la API de TTS
   */
  async generateSpeech(
    text: string,
    _language: string = DEFAULT_LANGUAGE,
    _speaker: string = 'default'
  ): Promise<Buffer> {
    try {
      // Limpiar markdown del texto antes de enviarlo al TTS
      const cleanText = cleanMarkdown(text);
      console.log(`[TTS] Generando voz para: "${cleanText.substring(0, 30)}..."`);

      // Piper TTS solo necesita el texto
      const requestData = {
        text: cleanText,
      };

      console.log(`[TTS] Enviando solicitud con ${cleanText.length} caracteres, timeout: 300s`);
      const startTime = Date.now();

      const response = await axios({
        method: 'post',
        url: `${TTS_URL}/tts`,
        data: requestData,
        responseType: 'arraybuffer',
        timeout: 300000, // 5 minutes for long texts
      });

      const duration = (Date.now() - startTime) / 1000;
      console.log(
        `[TTS] Audio generado en ${duration.toFixed(2)} segundos, ${response.data.byteLength} bytes`
      );

      return Buffer.from(response.data);
    } catch (error: any) {
      console.error('❌ [TTS] Error generando audio:', error.message);
      throw new Error(`No se pudo generar el audio: ${error.message}`);
    }
  }
}

export const ttsService = new TTSServiceImpl();
export default ttsService;
