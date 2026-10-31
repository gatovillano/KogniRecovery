import { NextRequest, NextResponse } from "next/server";
import { readSessionCookie } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await readSessionCookie(request.headers.get("cookie"));

  if (!session) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      user: {
        id: session.userId,
        email: session.email,
        name: session.name,
        role: session.role,
      },
    },
  });
}
