/**
 * Cliente API del panel web.
 *
 * Todas las llamadas van al BFF del mismo origen (`/api/...`), que es
 * el que mantiene la cookie httpOnly y reenvía al backend de
 * Numa. El navegador nunca ve el access token.
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

export class ApiClientError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
  }
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `/api${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    const data = (await response.json().catch(() => null)) as ApiResponse<T> | null;

    if (!response.ok) {
      const code = data?.error?.code ?? "REQUEST_FAILED";
      const message = data?.error?.message ?? `Error ${response.status}`;

      if (response.status === 401) {
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }

      throw new ApiClientError(message, response.status, code);
    }

    return data ?? ({ success: true } as ApiResponse<T>);
  }

  async get<T>(endpoint: string, params?: Record<string, string | number | boolean>) {
    const queryString = params
      ? "?" +
        new URLSearchParams(
          Object.entries(params).map(([key, value]) => [key, String(value)])
        ).toString()
      : "";
    return this.request<T>(`${endpoint}${queryString}`);
  }

  async post<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  async login(email: string, password: string) {
    return this.request<
      | { user: { id: string; email: string; name: string; role: string } }
      | { mfa_required: true; challenge: string; user: { id: string; email: string; name: string; role: string } }
    >("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async loginMfa(challenge: string, code: string) {
    return this.request<{ user: { id: string; email: string; name: string; role: string } }>(
      "/auth/mfa-verify",
      {
        method: "POST",
        body: JSON.stringify({ challenge, code }),
      }
    );
  }

  async logout() {
    return this.request("/auth/logout", { method: "POST" });
  }

  async me() {
    return this.request<{ user: { id: string; email: string; name: string; role: string } }>(
      "/auth/me"
    );
  }
}

export const api = new ApiClient();
