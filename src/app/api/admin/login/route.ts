import { NextResponse } from "next/server";
import { passwordMatches, setAdminCookie } from "@/lib/admin-auth";

export async function POST(req: Request) {
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  if (!process.env.ADMIN_PASSWORD) return NextResponse.json({ error: "Set ADMIN_PASSWORD in your hosting settings first." }, { status: 503 });
  if (!password || !passwordMatches(password)) return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  await setAdminCookie();
  return NextResponse.json({ ok: true });
}
