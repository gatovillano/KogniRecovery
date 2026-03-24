/**
 * Cliente HTTP - KogniRecovery
 * Servicio de API con manejo de autenticación, errores y retry automático
 */

import * as Network from 'expo-network';
import { router } from 'expo-router';
import {
  ApiResponse,
  ApiError,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  AuthResponse,
} from '../types/api';
import { AUTH_ENDPOINTS, USER_ENDPOINTS, API_CONFIG } from './endpoints';

// ============================================
// Configuración
// ============================================

interface ApiClientConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  retryDelay: number;
}

const DEFAULT_CONFIG: ApiClientConfig = {
  baseUrl: `${API_CONFIG.BASE_URL}/api/v1`,
  timeout: 90000,
  retries: 1,
  retryDelay: 1000,
};

// ============================================
// Estado de autenticación
// ============================================

let authTokens: AuthTokens | null = null;
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;
let onUnauthorizedCallback: (() => void) | null = null;

export const setOnUnauthorized = (callback: () => void): void => {
  onUnauthorizedCallback = callback;
};

// ============================================
// Funciones de almacenamiento de tokens
// ============================================

/**
 * Guarda los tokens de autenticación
 */
export const setAuthTokens = (tokens: AuthTokens): void => {
  authTokens = tokens;

  // Guardar en AsyncStorage en producción
  // await AsyncStorage.setItem('accessToken', tokens.accessToken);
  // await AsyncStorage.setItem('refreshToken', tokens.refreshToken);
  // await AsyncStorage.setItem('tokenExpiry', String(tokens.expiresAt));
};

/**
 * Obtiene los tokens de autenticación
 */
export const getAuthTokens = (): AuthTokens | null => {
  return authTokens;
};

/**
 * Limpia los tokens de autenticación
 */
export const clearAuthTokens = (): void => {
  authTokens = null;

  // Limpiar AsyncStorage en producción
  // await AsyncStorage.removeItem('accessToken');
  // await AsyncStorage.removeItem('refreshToken');
  // await AsyncStorage.removeItem('tokenExpiry');
};

// ============================================
// Verificación de red
// ============================================

/**
 * Verifica el estado de la red
 */
const checkNetwork = async (): Promise<boolean> => {
  try {
    const networkState = await Network.getNetworkStateAsync();
    return networkState.isConnected ?? false;
  } catch {
    return false;
  }
};

// ============================================
// Manejo de errores
// ============================================

/**
 * Crea un objeto de error de API
 */
const createApiError = (status: number, message: string): ApiError => {
  const errorCodes: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'VALIDATION_ERROR',
    429: 'RATE_LIMITED',
    500: 'SERVER_ERROR',
    502: 'BAD_GATEWAY',
    503: 'SERVICE_UNAVAILABLE',
  };

  return {
    message,
    code: errorCodes[status] || 'UNKNOWN_ERROR',
    status,
  };
};

/**
 * Maneja errores específicos por código de estado
 */
const handleErrorStatus = (status: number): void => {
  switch (status) {
    case 401:
      // Redirigir a login cuando no está autorizado (solo si el router está listo)
      clearAuthTokens();

      // Llamar al callback de no autorizado (esto limpiará el Zustand store y actualizará el router)
      if (onUnauthorizedCallback) {
        try {
          onUnauthorizedCallback();
        } catch (e) {
          console.error('Error al ejecutar callback de no autorizado:', e);
        }
      }

      try {
        router.replace('/auth/login');
      } catch (e) {
        console.warn('⚠️ Router no listo para redirigir');
      }
      break;
    case 403:
      console.warn('Acceso denegado');
      break;
    case 500:
    case 502:
    case 503:
      console.error('Error del servidor, por favor intenta más tarde');
      break;
    default:
      break;
  }
};

// ============================================
// Request con retry automático
// ============================================

interface RequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
}

/**
 * Realiza una petición HTTP con retry automático
 */
const fetchWithRetry = async (
  url: string,
  options: RequestConfig,
  config: ApiClientConfig
): Promise<Response> => {
  const { retries = config.retries, timeout = 30000, ...fetchOptions } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Desactivamos el check de red para evitar falsos negativos en dispositivos
      /*
      const isConnected = await checkNetwork();
      if (!isConnected) {
        throw new Error('NO_INTERNET');
      }
      */

      // Crear controller para el timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      return response;
    } catch (error) {
      lastError = error as Error;
      console.warn(`⚠️ [API] Falló conexión a: ${url}`);

      // No hacer retry si es error 401 (ya se maneja por separado)
      if (error instanceof Response && error.status === 401) {
        throw error;
      }

      // No hacer retry si se agotaron los intentos
      if (attempt >= retries) {
        break;
      }

      // Esperar antes de reintentar (exponential backoff)
      const delay = config.retryDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Request failed');
};

// ============================================
// Interceptors
// ============================================

interface InterceptorConfig {
  headers: Record<string, string>;
}

/**
 * Aplica el interceptor de request (agrega headers, etc)
 */
const applyRequestInterceptor = async (
  url: string,
  options: RequestInit
): Promise<[string, RequestInit]> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // Agregar token de autorización si existe
  if (authTokens?.accessToken) {
    headers['Authorization'] = `Bearer ${authTokens.accessToken}`;
  }

  return [url, { ...options, headers }];
};

/**
 * Aplica el interceptor de response (manejo de errores)
 */
const applyResponseInterceptor = async (response: Response): Promise<Response> => {
  // Manejar errores 401 (excepto en login/registro donde es normal recibir 401 si las credenciales fallan)
  if (response.status === 401 && !response.url.includes('/auth/login') && !response.url.includes('/auth/register')) {
    // Intentar refresh token
    const refreshed = await tryRefreshToken();

    if (!refreshed) {
      handleErrorStatus(401);
      throw createApiError(401, 'Sesión expirada');
    }

    // Si se refreshó exitosamente, reintentar request
    // Esto se maneja en el método request()
  }

  // Manejar errores 500
  if (response.status >= 500) {
    handleErrorStatus(response.status);
  }

  // Verificar si la respuesta es JSON válida
  const contentType = response.headers.get('content-type');
  if (contentType && !contentType.includes('application/json')) {
    throw createApiError(response.status, 'Respuesta inválida del servidor');
  }

  return response;
};

// ============================================
// Refresh token
// ============================================

/**
 * Intenta refrescar el token de acceso
 */
const tryRefreshToken = async (): Promise<boolean> => {
  // Evitar múltiples refresh simultáneos
  if (isRefreshing) {
    return refreshPromise ?? Promise.resolve(false);
  }

  if (!authTokens?.refreshToken) {
    return false;
  }

  isRefreshing = true;

  refreshPromise = (async () => {
    try {
      const response = await fetch(AUTH_ENDPOINTS.REFRESH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: authTokens?.refreshToken,
        } as RefreshTokenRequest),
      });

      if (response.ok) {
        const data: ApiResponse<AuthResponse> = await response.json();
        setAuthTokens({
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken,
          expiresAt: Date.now() + data.data.expiresIn * 1000,
        });
        return true;
      }

      // Refresh falló, cerrar sesión
      clearAuthTokens();
      return false;
    } catch {
      clearAuthTokens();
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

// ============================================
// Métodos HTTP principales
// ============================================

/**
 * Realiza una petición HTTP genérica
 */
const request = async <T>(
  method: string,
  url: string,
  data?: unknown,
  options?: RequestInit
): Promise<T> => {
  const config = DEFAULT_CONFIG;

  // Asegurar que la URL sea absoluta
  // Si ya tiene http, la usamos. Si no, le ponemos el baseUrl configurado.
  const finalUrl = url.startsWith('http') ? url : `${config.baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;

  // Aplicar interceptor de request
  const [requestUrl, requestOptions] = await applyRequestInterceptor(finalUrl, {
    method,
    ...options,
    body: data ? JSON.stringify(data) : undefined,
  });

  // Realizar petición
  let response = await fetchWithRetry(requestUrl, requestOptions, config);

  // Aplicar interceptor de response
  response = await applyResponseInterceptor(response);

  // Manejar respuesta
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    // Si hay detalles de validación, extraer el primer mensaje detallado
    let errorMessage = errorData.message || errorData.error?.message || `Error ${response.status}`;

    if (errorData.error?.details && Array.isArray(errorData.error.details)) {
      errorMessage = errorData.error.details[0].message;
    }

    throw createApiError(
      response.status,
      errorMessage
    );
  }

  // Parsear respuesta
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
};

/**
 * GET - Obtener datos
 */
export const get = async <T>(
  url: string,
  params?: Record<string, string | number | boolean>
): Promise<T> => {
  let fullUrl = url;

  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();

    // Soportar tanto { days } como { params: { days } } (estilo Axios)
    const validParams: any = (params as any).params || params;

    Object.entries(validParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryString;
    }
  }

  return request<T>('GET', fullUrl);
};

/**
 * POST - Crear recursos
 */
export const post = async <T>(url: string, data?: unknown): Promise<T> => {
  return request<T>('POST', url, data);
};

/**
 * PUT - Actualizar recursos completamente
 */
export const put = async <T>(url: string, data?: unknown): Promise<T> => {
  return request<T>('PUT', url, data);
};

/**
 * PATCH - Actualizar recursos parcialmente
 */
export const patch = async <T>(url: string, data?: unknown): Promise<T> => {
  return request<T>('PATCH', url, data);
};

/**
 * DELETE - Eliminar recursos
 */
export const del = async <T>(url: string): Promise<T> => {
  return request<T>('DELETE', url);
};

// ============================================
// Métodos de autenticación
// ============================================

/**
 * Inicia sesión con email y contraseña
 */
export const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
  console.log('📡 API: Enviando POST login a:', AUTH_ENDPOINTS.LOGIN);
  const response = await post<ApiResponse<any>>(AUTH_ENDPOINTS.LOGIN, credentials);
  console.log('📬 API: Respuesta de login:', response.success ? 'EXITO' : 'FALLO');

  const { user, tokens } = response.data;

  // Guardar tokens (asumimos 1 hora de expiración si no viene)
  setAuthTokens({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: Date.now() + (response.data.expiresIn || 3600) * 1000,
  });

  return {
    user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: response.data.expiresIn || 3600
  };
};

/**
 * Registra un nuevo usuario
 */
export const register = async (userData: RegisterRequest): Promise<AuthResponse> => {
  console.log('📡 API: Enviando POST registro a:', AUTH_ENDPOINTS.REGISTER);
  console.log('✉️ Body:', JSON.stringify(userData));
  const response = await post<ApiResponse<any>>(AUTH_ENDPOINTS.REGISTER, userData);
  console.log('📬 API: Respuesta de registro:', response.success ? 'EXITO' : 'FALLO');

  const { user, tokens } = response.data;

  // Guardar tokens
  setAuthTokens({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: Date.now() + (response.data.expiresIn || 3600) * 1000,
  });

  return {
    user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: response.data.expiresIn || 3600
  };
};

/**
 * Cierra la sesión del usuario
 */
export const logout = async (): Promise<void> => {
  try {
    await post(AUTH_ENDPOINTS.LOGOUT);
  } catch {
    // Ignorar errores al cerrar sesión
  } finally {
    clearAuthTokens();
    router.replace('/auth/login');
  }
};

/**
 * Verifica si el token actual es válido
 */
export const verifyToken = async (): Promise<boolean> => {
  if (!authTokens?.accessToken) {
    return false;
  }

  try {
    const response = await get<{ valid: boolean }>(AUTH_ENDPOINTS.VERIFY);
    return response.valid;
  } catch {
    return false;
  }
};

// ============================================
// Funciones de utilidad
// ============================================

/**
 * Verifica si hay conexión a internet
 */
export const isOnline = async (): Promise<boolean> => {
  return checkNetwork();
};

/**
 * Configura el cliente API con opciones personalizadas
 */
export const configureApiClient = (config: Partial<ApiClientConfig>): void => {
  Object.assign(DEFAULT_CONFIG, config);
};

/**
 * Obtiene la configuración actual del cliente
 */
export const getApiConfig = (): ApiClientConfig => {
  return { ...DEFAULT_CONFIG };
};

/**
 * Obtiene los modelos disponibles para un proveedor
 */
export const getAIModels = async (provider: string): Promise<ApiResponse<any[]>> => {
  return get<ApiResponse<any[]>>('/profiles/ai-models', { provider });
};

// ============================================
// Exportar por defecto
// ============================================

const apiClient = {
  get,
  post,
  put,
  patch,
  delete: del,
  login,
  register,
  logout,
  verifyToken,
  isOnline,
  configureApiClient,
  getApiConfig,
  setAuthTokens,
  getAuthTokens,
  clearAuthTokens,
  setOnUnauthorized,
  getAIModels,
};

// ============================================
// Servicios de Perfil e IA
// ============================================

/**
 * Actualiza el perfil del usuario
 */
export const updateProfile = async (data: any): Promise<ApiResponse<any>> => {
  return put<ApiResponse<any>>(USER_ENDPOINTS.UPDATE_PROFILE, data);
};

/**
 * Actualiza los ajustes de IA (Proveedor, Modelo, API Key)
 */
export const updateAISettings = async (data: {
  llm_provider: string;
  llm_model: string;
  llm_api_key?: string;
}): Promise<ApiResponse<any>> => {
  return put<ApiResponse<any>>(USER_ENDPOINTS.UPDATE_AI_SETTINGS, data);
};

export const api = apiClient;
export default apiClient;

// Exportar tipos para uso externo
export type {
  ApiClientConfig,
  RequestConfig,
};
