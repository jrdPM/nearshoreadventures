import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { githubConfigured, readJson } from "@/lib/github";
import type { ReviewItem, Source } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!githubConfigured()) return NextResponse.json({ error: "Set GITHUB_TOKEN so the admin page can read and save the queue." }, { status: 503 });
  const [queue, report, sources] = await Promise.all([
    readJson<ReviewItem[]>("data/review-queue.json", []),
    readJson<Record<string, unknown> | null>("data/scrape-report.json", null),
    readJson<Source[]>("data/sources.json", []),
  ]);
  return NextResponse.json({ queue, report, sources });
}
