/**
 * Last resort for pages with no feed or markup: have Claude read the page text and pull
 * out the events. Only runs when ANTHROPIC_API_KEY is set. Everything it finds is held
 * for review unless it's confident and the source is trusted.
 */
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import * as cheerio from "cheerio";
import type { RawEvent } from "../raw";
import { CATEGORIES } from "../../../src/lib/categories";
import type { CategoryId } from "../../../src/lib/types";

const MODEL = process.env.NEARSHORE_AI_MODEL || "claude-opus-5-5";
const MAX_CHARS = 60_000;

const EventsSchema = z.object({
  events: z.array(
    z.object({
      title: z.string(),
      start: z.string().describe("ISO 8601 local Cape Cod time, e.g. 2026-11-07T19:00 — or yyyy-MM-dd if no time is given"),
      end: z.string().nullable(),
      all_day: z.boolean(),
      description: z.string().nullable().describe("One or two sentences in your own words, not copied text"),
      url: z.string().nullable().describe("Link to this event's own page if the page shows one"),
      venue_name: z.string().nullable(),
      address: z.string().nullable().describe("Street address and town if shown"),
      price: z.string().nullable(),
      free: z.boolean().nullable(),
      categories: z.array(z.enum(CATEGORIES.map((c) => c.id) as [CategoryId, ...CategoryId[]])),
      confidence: z.number().describe("0 to 1: how sure you are the date, time and place are right"),
    }),
  ),
});

export function pageText(html: string) {
  const $ = cheerio.load(html);
  $("script, style, noscript, svg, iframe, header nav, footer").remove();
  const links: string[] = [];
  $("a[href]").each((_, a) => {
    const t = $(a).text().trim();
    if (t.length > 6 && links.length < 300) links.push(`[${t}](${$(a).attr("href")})`);
  });
  const text = $("body").text().replace(/\s+\n/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return `${text}\n\nLINKS:\n${links.join("\n")}`.slice(0, MAX_CHARS);
}

export const aiEnabled = () => !!process.env.ANTHROPIC_API_KEY;

export async function extractWithAi(html: string, pageUrl: string, today: string): Promise<RawEvent[]> {
  const client = new Anthropic();
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(EventsSchema) },
    system:
      "You pull public events out of web pages for a Cape Cod, Massachusetts events calendar. " +
      "Only include events with a specific date that is on or after today. Skip recurring office hours, closures and ads. " +
      "Write each description in your own words. If the year isn't shown, assume the next upcoming occurrence.",
    messages: [
      {
        role: "user",
        content: `Today is ${today}. Page URL: ${pageUrl}\n\n<page>\n${pageText(html)}\n</page>`,
      },
    ],
  });
  if (response.stop_reason === "refusal" || !response.parsed_output) return [];
  return response.parsed_output.events.map((e) => ({
    title: e.title,
    start: e.start,
    end: e.end ?? undefined,
    allDay: e.all_day,
    description: e.description ?? undefined,
    url: e.url ? new URL(e.url, pageUrl).toString() : pageUrl,
    venueName: e.venue_name ?? undefined,
    address: e.address ?? undefined,
    price: e.price ?? undefined,
    free: e.free ?? undefined,
    categories: e.categories,
    confidence: e.confidence,
  }));
}
