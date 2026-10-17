/**
 * Builds the Thursday email from data/events.json and sends it through Beehiiv.
 * Runs from .github/workflows/newsletter.yml. Always saves a copy to newsletter/<date>.html.
 *
 *   npm run newsletter            build + send (if Beehiiv keys are set)
 *   npm run newsletter -- --dry   build only
 */
import fs from "node:fs";
import path from "node:path";
import type { CapeEvent } from "../src/lib/types";
import { buildDigest, renderEmailHtml } from "../src/lib/newsletter";
import { fmt } from "../src/lib/dates";

async function main() {
  const dry = process.argv.includes("--dry");
  const all = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "events.json"), "utf8")) as CapeEvent[];
  const upcoming = all.filter((e) => !e.sample && new Date(e.end ?? e.start).getTime() >= Date.now());
  const digest = buildDigest(upcoming.length ? upcoming : all);
  const html = renderEmailHtml(digest);

  const outDir = path.join(process.cwd(), "newsletter");
  fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, `${fmt(new Date(), "yyyy-MM-dd")}.html`);
  fs.writeFileSync(file, html);
  console.log(`Built "${digest.subject}" with ${digest.picks.length} picks and ${digest.total} events → ${path.relative(process.cwd(), file)}`);

  if (!upcoming.length) {
    console.log("No real events yet (only sample data), so not sending.");
    return;
  }
  const key = process.env.BEEHIIV_API_KEY;
  const pub = process.env.BEEHIIV_PUBLICATION_ID;
  if (dry || !key || !pub) {
    console.log(dry ? "Dry run, not sending." : "BEEHIIV_API_KEY / BEEHIIV_PUBLICATION_ID not set, so not sending.");
    return;
  }

  const res = await fetch(`https://api.beehiiv.com/v2/publications/${pub}/posts`, {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      title: digest.subject,
      subtitle: digest.preview,
      body_content: html,
      status: "confirmed", // send now
      content_tags: ["weekly"],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`Beehiiv said ${res.status}: ${text}`);
    if (res.status === 403) console.error("Your Beehiiv plan may not allow sending posts through the API. The email is saved in newsletter/ so it can be pasted in by hand.");
    process.exit(1);
  }
  console.log("Sent to Beehiiv.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
