import { NextRequest, NextResponse } from "next/server";
import { signSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";

interface MfaVerifyRequest {
  challenge: string;
  code: string;
}

interface BackendMfaResponse {
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
  };
  error?: {
    code: string;
    message: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as MfaVerifyRequest;

    if (!body.challenge || !body.code) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_PAYLOAD", message: "challenge y code son obligatorios" } },
        { status: 400 }
      );
    }

    const backendResponse = await fetch(`${API_BASE_URL}/api/v1/auth/mfa/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challenge: body.challenge, code: body.code }),
    });

    const data = (await backendResponse.json()) as BackendMfaResponse;

    if (!backendResponse.ok || !data.success || !data.data) {
      return NextResponse.json(
        {
          success: false,
          error:
            data.error ??
            { code: "MFA_VERIFY_FAILED", message: "Código inválido" },
        },
        { status: backendResponse.status }
      );
    }

    const { user, tokens } = data.data;

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
    console.error("Error en verificación MFA BFF:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Error del servidor" } },
      { status: 500 }
    );
  }
}
