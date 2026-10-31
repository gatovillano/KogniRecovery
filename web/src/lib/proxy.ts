import { NextRequest, NextResponse } from "next/server";
import { readSessionCookie } from "@/lib/auth";

/**
 * Proxy BFF genérico.
 *
 * El navegador llama a `/api/...` en el mismo origen. Aquí se lee la
 * cookie httpOnly, se extrae el access token del backend y se reenvía la
 * petición a la API de Numa. El access token nunca viaja al
 * navegador.
 *
 * Defensa CSRF: en métodos que mutan estado, se rechaza la petición si
 * el header Origin no coincide con el origen del sitio.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export async function proxy(request: NextRequest, path: string) {
  const session = await readSessionCookie(request.headers.get("cookie"));

  if (!session) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Sesión expirada" } },
      { status: 401 }
    );
  }

  // Defensa CSRF para mutaciones.
  if (MUTATING_METHODS.has(request.method)) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin) {
      try {
        const originUrl = new URL(origin);
        if (originUrl.host !== host) {
          return NextResponse.json(
            { success: false, error: { code: "CSRF_REJECTED", message: "Origen inválido" } },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          { success: false, error: { code: "CSRF_REJECTED", message: "Origen inválido" } },
          { status: 403 }
        );
      }
    }
  }

  const backendUrl = `${API_BASE_URL}/api/v1/${path}`;

  const backendHeaders: Record<string, string> = {
    Authorization: `Bearer ${session.accessToken}`,
    "Content-Type": "application/json",
  };

  // Conservar headers que pueden importar al backend.
  const xOrg = request.headers.get("x-organization-id");
  if (xOrg) backendHeaders["X-Organization-Id"] = xOrg;

  const requestId = request.headers.get("x-request-id");
  if (requestId) backendHeaders["X-Request-Id"] = requestId;

  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.text();

  try {
    const backendResponse = await fetch(backendUrl, {
      method: request.method,
      headers: backendHeaders,
      body,
      cache: "no-store",
    });

    const contentType = backendResponse.headers.get("content-type") ?? "";
    let payload: unknown;

    if (contentType.includes("application/json")) {
      payload = await backendResponse.json();
    } else {
      payload = await backendResponse.text();
    }

    const response = NextResponse.json(payload, { status: backendResponse.status });

    const requestIdHeader = backendResponse.headers.get("x-request-id");
    if (requestIdHeader) response.headers.set("x-request-id", requestIdHeader);

    return response;
  } catch (error) {
    console.error("Error en proxy BFF:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "UPSTREAM_UNAVAILABLE", message: "El servicio clínico no está disponible" },
      },
      { status: 502 }
    );
  }
}
