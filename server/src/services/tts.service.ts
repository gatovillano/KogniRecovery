/**
 * TTS Service
 * Maneja la generación de voz a partir de texto.
 *
 * Proveedores:
 *  - ElevenLabs (nube, mejor calidad; requiere API key).
 *  - Kokoro (local vía Docker, gratis; fallback por defecto).
 *
 * Flujo: si el proveedor configurado es ElevenLabs y su llamada falla
 * (cuota agotada, límite de caracteres, rate limit, error de red o 5xx),
 * se reintenta automáticamente contra Kokoro cuando el fallback está
 * habilitado en la configuración del centro.
 * KogniRecovery - Sistema de Acompañamiento en Adicciones
 */

import axios from 'axios';
import {
  resolveTtsConfig,
  type TtsConfigResolved,
} from './ttsSettings.service.js';

export interface TtsAudio {
  data: Buffer;
  contentType: string;
}

export interface TTSService {
  generateSpeech(
    text: string,
    language?: string,
    speaker?: string,
    opts?: {
      /** Configuración ya resuelta (por organización). Si se omite, se resuelve desde entorno. */
      config?: TtsConfigResolved;
      /** Permite usar Kokoro como fallback cuando ElevenLabs falla. Default: true. */
      allowFallback?: boolean;
    }
  ): Promise<TtsAudio>;
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

const ELEVENLABS_API = 'https://api.elevenlabs.io/v1';

export class TTSServiceImpl implements TTSService {
  /**
   * Genera audio a partir de texto usando el proveedor configurado.
   * ElevenLabs primero y Kokoro como fallback si está habilitado.
   */
  async generateSpeech(
    text: string,
    language: string = 'es',
    speaker: string = 'default',
    opts: { config?: TtsConfigResolved; allowFallback?: boolean } = {}
  ): Promise<TtsAudio> {
    const cleanText = cleanMarkdown(text);
    const config = opts.config ?? (await resolveTtsConfig(null));
    const allowFallback = opts.allowFallback !== false;

    console.log(
      `[TTS] Generando voz (${cleanText.length} caracteres) · proveedor=${config.provider}`
    );

    // Proveedor principal: ElevenLabs (si hay key configurada).
    if (config.provider === 'elevenlabs' && config.elevenlabsApiKey) {
      try {
        return await this.synthesizeElevenLabs(cleanText, config);
      } catch (error: any) {
        const reason = this.extractElevenError(error);
        console.warn(`❌ [TTS] ElevenLabs falló, ${reason}`);
        if (allowFallback && config.fallbackEnabled) {
          console.log('[TTS] Usando Kokoro como fallback');
          return await this.synthesizeKokoro(cleanText, config, language, speaker);
        }
        throw new Error(`No se pudo generar el audio con ElevenLabs: ${reason}`);
      }
    }

    // Kokoro (local) o sin key de ElevenLabs.
    return this.synthesizeKokoro(cleanText, config, language, speaker);
  }

  /**
   * Sintetiza con ElevenLabs. Devuelve audio MP3.
   */
  private async synthesizeElevenLabs(
    text: string,
    config: TtsConfigResolved
  ): Promise<TtsAudio> {
    const voiceId = encodeURIComponent(config.elevenlabsVoiceId);
    const started = Date.now();
    const response = await axios({
      method: 'post',
      url: `${ELEVENLABS_API}/text-to-speech/${voiceId}`,
      headers: {
        'xi-api-key': config.elevenlabsApiKey!,
        Accept: 'audio/mpeg',
      },
      data: {
        text,
        model_id: config.elevenlabsModel,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: false,
        },
      },
      responseType: 'arraybuffer',
      timeout: 60000, // 60s
    });

    const duration = (Date.now() - started) / 1000;
    console.log(
      `[TTS] ElevenLabs: audio MP3 generado en ${duration.toFixed(2)}s, ${response.data.byteLength} bytes`
    );
    return { data: Buffer.from(response.data), contentType: 'audio/mpeg' };
  }

  /**
   * Extrae un mensaje legible del error de ElevenLabs (HTTP o red).
   */
  private extractElevenError(error: any): string {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      let detail = '';
      if (error.response?.data) {
        try {
          const body = JSON.parse(Buffer.from(error.response.data).toString('utf8'));
          detail = body.detail || body.message || JSON.stringify(body);
        } catch {
          detail = Buffer.from(error.response.data).toString('utf8').slice(0, 300);
        }
      }
      if (status === 401) return `API key inválida (401): ${detail}`.trim();
      if (status === 402) return `cuota o créditos agotados (402): ${detail}`.trim();
      if (status === 422) return `solicitud inválida (422): ${detail}`.trim();
      if (status === 429) return `límite de peticiones alcanzado (429): ${detail}`.trim();
      if (status && status >= 500) return `error del servicio ElevenLabs (${status}): ${detail}`.trim();
      return `HTTP ${status ?? '?'}: ${detail}`.trim();
    }
    return error?.message || String(error);
  }

  /**
   * Sintetiza con Kokoro (local). Devuelve audio WAV.
   */
  private async synthesizeKokoro(
    text: string,
    config: TtsConfigResolved,
    language: string,
    speaker: string
  ): Promise<TtsAudio> {
    const voice = speaker && speaker !== 'default' ? speaker : config.kokoroVoice;

    const requestData: Record<string, any> = {
      text,
      voice,
      lang: language || 'es',
      speed: 1.0,
    };

    console.log(
      `[TTS] Kokoro: enviando ${text.length} caracteres a ${config.kokoroUrl} (voz=${voice}), timeout 300s`
    );
    const started = Date.now();

    const response = await axios({
      method: 'post',
      url: `${config.kokoroUrl.replace(/\/+$/, '')}/tts`,
      data: requestData,
      responseType: 'arraybuffer',
      timeout: 300000, // 5 minutos para textos largos
    });

    const duration = (Date.now() - started) / 1000;
    console.log(
      `[TTS] Kokoro: audio WAV generado en ${duration.toFixed(2)}s, ${response.data.byteLength} bytes`
    );
    return { data: Buffer.from(response.data), contentType: 'audio/wav' };
  }
}

export const ttsService = new TTSServiceImpl();
export default ttsService;
