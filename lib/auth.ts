import { cookies } from "next/headers";
import { ADMIN_CONFIG } from "@/config/admin";

const COOKIE_NAME = "admin_session";

export async function login(
  username: string,
  password: string
): Promise<boolean> {
  if (!ADMIN_CONFIG.username || !ADMIN_CONFIG.password) {
    return false;
  }

  if (username !== ADMIN_CONFIG.username) return false;
  if (password !== ADMIN_CONFIG.password) return false;

  const token = process.env.ADMIN_SESSION_TOKEN as string;
  if (!token) return false;

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return true;
}

export function logout(): void {
  cookies().delete(COOKIE_NAME);
}

export function requireAdmin(): void {
  const token = cookies().get(COOKIE_NAME)?.value;
  const expected = process.env.ADMIN_SESSION_TOKEN;
  if (!token || !expected || token !== expected) {
    throw new Error("UNAUTHORIZED");
  }
}

export function isAdmin(): boolean {
  const token = cookies().get(COOKIE_NAME)?.value;
  const expected = process.env.ADMIN_SESSION_TOKEN;
  return !!token && !!expected && token === expected;
}
