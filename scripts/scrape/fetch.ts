/** Polite HTTP helpers: identify ourselves, respect robots.txt, time out, retry once. */
const UA = "NearshoreAdventuresBot/1.0 (+https://nearshoreadventures.com/about; Cape Cod events calendar)";

const robotsCache = new Map<string, string[]>();

async function disallowedPaths(origin: string): Promise<string[]> {
  if (robotsCache.has(origin)) return robotsCache.get(origin)!;
  let rules: string[] = [];
  try {
    const res = await fetch(`${origin}/robots.txt`, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(10_000) });
    if (res.ok) {
      const txt = await res.text();
      let applies = false;
      for (const raw of txt.split(/\r?\n/)) {
        const line = raw.split("#")[0].trim();
        const [k, ...rest] = line.split(":");
        const v = rest.join(":").trim();
        if (/^user-agent$/i.test(k)) applies = v === "*" || /nearshore/i.test(v);
        else if (applies && /^disallow$/i.test(k) && v) rules.push(v);
      }
    }
  } catch {
    rules = [];
  }
  robotsCache.set(origin, rules);
  return rules;
}

export async function allowedByRobots(url: string) {
  const u = new URL(url);
  const rules = await disallowedPaths(u.origin);
  const p = u.pathname + u.search;
  return !rules.some((r) => (r === "/" ? true : p.startsWith(r.replace(/\*.*$/, ""))));
}

export async function get(url: string, accept = "text/html,application/json;q=0.9,*/*;q=0.8"): Promise<Response> {
  if (!(await allowedByRobots(url))) throw new Error(`robots.txt disallows ${url}`);
  let last: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "user-agent": UA, accept },
        redirect: "follow",
        signal: AbortSignal.timeout(25_000),
      });
      if (res.status >= 500) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      last = err;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  throw last instanceof Error ? last : new Error(String(last));
}

export async function getText(url: string, accept?: string) {
  const res = await get(url, accept);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
