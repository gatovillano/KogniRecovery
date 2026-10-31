import { NextRequest, NextResponse } from "next/server";
import { signSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";

interface LoginRequest {
  email: string;
  password: string;
}

interface BackendLoginResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
    mfa_required?: boolean;
    challenge?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LoginRequest;

    if (!body.email || !body.password) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_PAYLOAD", message: "Email y contraseña son obligatorios" } },
        { status: 400 }
      );
    }

    const backendResponse = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: body.email, password: body.password }),
    });

    const data = (await backendResponse.json()) as BackendLoginResponse;

    if (!backendResponse.ok || !data.success || !data.data) {
      return NextResponse.json(
        {
          success: false,
          error:
            data.error ??
            { code: "LOGIN_FAILED", message: "Credenciales inválidas" },
        },
        { status: backendResponse.status }
      );
    }

    const { user, tokens } = data.data;

    // Los profesionales son los únicos que usan el panel. Si un paciente
    // intenta entrar, no se le otorga sesión.
    if (user.role !== "professional" && user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Este panel es para profesionales de salud" },
        },
        { status: 403 }
      );
    }

    // Segundo paso: si el usuario tiene MFA activo, devolvemos el challenge
    // sin crear sesión. El cliente debe completar el código TOTP.
    if (data.data.mfa_required) {
      return NextResponse.json({
        success: true,
        data: {
          mfa_required: true,
          challenge: data.data.challenge,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        },
      });
    }

    const sessionToken = await signSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      accessToken: tokens.accessToken,
      expiresAt: Date.now() + SESSION_MAX_AGE * 1000,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error("Error en login BFF:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Error del servidor" } },
      { status: 500 }
    );
  }
}
