import { NextResponse } from "next/server";

/** Adds a subscriber to Beehiiv. Needs BEEHIIV_API_KEY and BEEHIIV_PUBLICATION_ID. */
export async function POST(req: Request) {
  const { email } = (await req.json().catch(() => ({}))) as { email?: string };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "That email doesn't look right." }, { status: 400 });

  const key = process.env.BEEHIIV_API_KEY;
  const pub = process.env.BEEHIIV_PUBLICATION_ID;
  if (!key || !pub) {
    return NextResponse.json({ error: "We're still setting up the email. Check back in a few days!" }, { status: 503 });
  }

  const res = await fetch(`https://api.beehiiv.com/v2/publications/${pub}/subscriptions`, {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ email, reactivate_existing: true, send_welcome_email: true, utm_source: "website", referring_site: "nearshoreadventures" }),
  });
  if (!res.ok) {
    console.error("Beehiiv subscribe failed", res.status, await res.text().catch(() => ""));
    return NextResponse.json({ error: "Couldn't sign you up just now. Please try again." }, { status: 502 });
  }
  return NextResponse.json({ message: "You're in! Look for us Thursday morning." });
}
