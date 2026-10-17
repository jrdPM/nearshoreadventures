// Writes the secrets the PHP scripts need into out/api/_config.php at deploy time.
// The file is blocked from the web by out/api/.htaccess and never committed.
import fs from "node:fs";

const out = process.argv[2];
const cfg = {
  admin_password: process.env.ADMIN_PASSWORD ?? "",
  github_token: process.env.SITE_GITHUB_TOKEN ?? "",
  github_repo: process.env.GITHUB_REPOSITORY ?? "jrdPM/nearshoreadventures",
  github_branch: "main",
  beehiiv_api_key: process.env.BEEHIIV_API_KEY ?? "",
  beehiiv_publication_id: process.env.BEEHIIV_PUBLICATION_ID ?? "",
};
const php = (s) => `'${String(s).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
const body = Object.entries(cfg).map(([k, v]) => `  ${php(k)} => ${php(v)},`).join("\n");
fs.writeFileSync(out, `<?php\n// Generated at deploy time. Do not commit.\nreturn [\n${body}\n];\n`, { mode: 0o600 });
console.log(`Wrote ${out} (${Object.entries(cfg).filter(([, v]) => v).map(([k]) => k).join(", ") || "no secrets set yet"})`);
