import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const ADMIN_COOKIE_NAME = "travellergy_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function hmac(input: string, secret: string): string {
  return createHmac("sha256", secret).update(input).digest("hex");
}

function safeEqualText(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function makeToken(expiresAt: number, secret: string): string {
  const payload = String(expiresAt);
  const sig = hmac(payload, secret);
  return `${payload}.${sig}`;
}

function verifyToken(token: string, secret: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  if (!payload || !sig) return false;

  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;

  const expectedSig = hmac(payload, secret);
  return safeEqualText(sig, expectedSig);
}

export function adminAuthConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD?.trim() && process.env.ADMIN_SESSION_SECRET?.trim());
}

export async function verifyAdminPassword(inputPassword: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD?.trim();
  if (!expected) return false;
  return safeEqualText(inputPassword.trim(), expected);
}

export async function setAdminSessionCookie(): Promise<void> {
  const secret = requiredEnv("ADMIN_SESSION_SECRET");
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const token = makeToken(expiresAt, secret);
  const store = await cookies();
  store.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearAdminSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (!secret) return false;
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE_NAME)?.value ?? "";
  if (!token) return false;
  return verifyToken(token, secret);
}
