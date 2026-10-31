import { SignJWT, jwtVerify } from "jose";

/**
 * Sesión del panel web (BFF).
 *
 * El navegador guarda una cookie `httpOnly` con un JWT firmado que
 * contiene el usuario y el access token del backend. El BFF es el único
 * que lee esa cookie y la usa para llamar a la API de Numa.
 */

export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
  accessToken: string;
  expiresAt: number;
}

const SESSION_COOKIE = "kr_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 4; // 4 horas

const getSecret = (): Uint8Array => {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET no está definido");
  }
  return new TextEncoder().encode(secret);
};

export const signSessionToken = async (payload: SessionPayload): Promise<string> => {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(await getSecret());
};

export const verifySessionToken = async (token: string): Promise<SessionPayload | null> => {
  try {
    const { payload } = await jwtVerify(token, await getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
};

export const readSessionCookie = async (
  cookieHeader: string | null
): Promise<SessionPayload | null> => {
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`));

  if (!match) return null;
  const token = match.slice(SESSION_COOKIE.length + 1);
  return verifySessionToken(token);
};

export const sessionCookieOptions = (): {
  name: string;
  value: string;
  options: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "lax";
    path: string;
    maxAge: number;
  };
} => ({
  name: SESSION_COOKIE,
  value: "",
  options: {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
});

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
export const SESSION_MAX_AGE = SESSION_MAX_AGE_SECONDS;
