import "server-only";

/**
 * The site's data lives in the repo (data/*.json). The admin page and the submit form
 * save changes by committing to GitHub, which kicks off a fresh deploy.
 */
const REPO = process.env.GITHUB_REPO || "jrdPM/nearshoreadventures";
const BRANCH = process.env.GITHUB_BRANCH || "main";
const API = `https://api.github.com/repos/${REPO}`;

export const githubConfigured = () => !!process.env.GITHUB_TOKEN;

async function gh<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      ...(init.body ? { "content-type": "application/json" } : {}),
    },
    cache: "no-store",
  });
  if (!res.ok) throw Object.assign(new Error(`GitHub ${res.status}: ${await res.text()}`), { status: res.status });
  return res.json() as Promise<T>;
}

export async function readJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const file = await gh<{ content: string; encoding: string }>(`/contents/${path}?ref=${BRANCH}`);
    return JSON.parse(Buffer.from(file.content, "base64").toString("utf8")) as T;
  } catch (err) {
    if ((err as { status?: number }).status === 404) return fallback;
    // Files over 1MB come back without content; use the raw media type instead.
    const res = await fetch(`${API}/contents/${path}?ref=${BRANCH}`, {
      headers: { authorization: `Bearer ${process.env.GITHUB_TOKEN}`, accept: "application/vnd.github.raw+json" },
      cache: "no-store",
    });
    if (!res.ok) throw err;
    return (await res.json()) as T;
  }
}

/**
 * Commit several files at once. `update` gets each file's current contents so we never
 * overwrite a change the scraper made a moment ago; on a race we retry from the new head.
 */
export async function commitJson(paths: string[], update: (current: Record<string, unknown>) => Record<string, unknown>, message: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const ref = await gh<{ object: { sha: string } }>(`/git/ref/heads/${BRANCH}`);
    const head = ref.object.sha;
    const commit = await gh<{ tree: { sha: string } }>(`/git/commits/${head}`);
    const current: Record<string, unknown> = {};
    for (const p of paths) current[p] = await readJsonAt(p, head);
    const next = update(current);
    const tree = await gh<{ sha: string }>(`/git/trees`, {
      method: "POST",
      body: JSON.stringify({
        base_tree: commit.tree.sha,
        tree: Object.entries(next).map(([path, data]) => ({ path, mode: "100644", type: "blob", content: JSON.stringify(data, null, 2) + "\n" })),
      }),
    });
    const created = await gh<{ sha: string }>(`/git/commits`, { method: "POST", body: JSON.stringify({ message, tree: tree.sha, parents: [head] }) });
    try {
      await gh(`/git/refs/heads/${BRANCH}`, { method: "PATCH", body: JSON.stringify({ sha: created.sha, force: false }) });
      return created.sha;
    } catch (err) {
      if ((err as { status?: number }).status !== 422 || attempt === 2) throw err;
    }
  }
}

async function readJsonAt(path: string, sha: string) {
  const res = await fetch(`${API}/contents/${path}?ref=${sha}`, {
    headers: { authorization: `Bearer ${process.env.GITHUB_TOKEN}`, accept: "application/vnd.github.raw+json" },
    cache: "no-store",
  });
  if (res.status === 404) return path.endsWith("decisions.json") ? {} : [];
  if (!res.ok) throw new Error(`GitHub ${res.status} reading ${path}`);
  return res.json();
}
