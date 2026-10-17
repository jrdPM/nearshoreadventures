import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "na_admin";
const token = () => createHmac("sha256", process.env.ADMIN_PASSWORD || "").update("nearshore-admin-v1").digest("hex");

export function passwordMatches(pw: string) {
  const real = process.env.ADMIN_PASSWORD;
  if (!real) return false;
  const a = Buffer.from(pw);
  const b = Buffer.from(real);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function setAdminCookie() {
  (await cookies()).set(COOKIE, token(), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 60 * 60 * 24 * 30 });
}

export async function isAdmin() {
  if (!process.env.ADMIN_PASSWORD) return false;
  const c = (await cookies()).get(COOKIE)?.value;
  return !!c && c.length === token().length && timingSafeEqual(Buffer.from(c), Buffer.from(token()));
}
