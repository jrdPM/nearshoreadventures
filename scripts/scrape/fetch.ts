/** Polite HTTP helpers: identify ourselves, respect robots.txt, time out, retry once. */
const UA = "NearshoreAdventuresBot/1.0 (+https://nearshoreadventures.com/about; Cape Cod events calendar)";

type Rule = { allow: boolean; path: string };
const robotsCache = new Map<string, Rule[]>();

/**
 * Parse robots.txt the way Google does: consecutive User-agent lines share one group,
 * a group naming us beats the "*" group, and Allow/Disallow support * and $ wildcards.
 */
export function parseRobots(txt: string): Rule[] {
  const groups: { agents: string[]; rules: Rule[] }[] = [];
  let cur: { agents: string[]; rules: Rule[] } | null = null;
  let lastWasAgent = false;
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.split("#")[0].trim();
    const i = line.indexOf(":");
    if (i < 0) continue;
    const k = line.slice(0, i).trim().toLowerCase();
    const v = line.slice(i + 1).trim();
    if (k === "user-agent") {
      if (!cur || !lastWasAgent) groups.push((cur = { agents: [], rules: [] }));
      cur.agents.push(v.toLowerCase());
      lastWasAgent = true;
    } else {
      lastWasAgent = false;
      if (cur && (k === "allow" || k === "disallow") && v) cur.rules.push({ allow: k === "allow", path: v });
    }
  }
  const ours = groups.filter((g) => g.agents.some((a) => a !== "*" && a.length > 0 && "nearshoreadventuresbot".includes(a)));
  const pick = ours.length ? ours : groups.filter((g) => g.agents.includes("*"));
  return pick.flatMap((g) => g.rules);
}

function ruleMatches(rule: string, path: string) {
  const anchored = rule.endsWith("$");
  const body = (anchored ? rule.slice(0, -1) : rule).replace(/[.+?^{}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${body}${anchored ? "$" : ""}`).test(path);
}

/** Longest matching rule wins; on a tie, Allow wins. No matching rule means allowed. */
export function isAllowed(rules: Rule[], path: string) {
  let best: Rule | null = null;
  for (const r of rules) {
    if (!ruleMatches(r.path, path)) continue;
    if (!best || r.path.length > best.path.length || (r.path.length === best.path.length && r.allow)) best = r;
  }
  return !best || best.allow;
}

async function robotsRules(origin: string): Promise<Rule[]> {
  if (robotsCache.has(origin)) return robotsCache.get(origin)!;
  let rules: Rule[] = [];
  try {
    const res = await fetch(`${origin}/robots.txt`, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(10_000) });
    if (res.ok) rules = parseRobots(await res.text());
  } catch {
    rules = [];
  }
  robotsCache.set(origin, rules);
  return rules;
}

export async function allowedByRobots(url: string) {
  const u = new URL(url);
  return isAllowed(await robotsRules(u.origin), u.pathname + u.search);
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
