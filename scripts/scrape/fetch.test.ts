import { test } from "node:test";
import assert from "node:assert/strict";
import { parseRobots, isAllowed } from "./fetch";

test("WordPress-style wildcard rules don't block the whole site", () => {
  const rules = parseRobots("User-agent: *\nDisallow: /wp-admin/\nDisallow: /*?*\nAllow: /wp-admin/admin-ajax.php\n");
  assert.equal(isAllowed(rules, "/events/"), true);
  assert.equal(isAllowed(rules, "/events/?page=2"), false);
  assert.equal(isAllowed(rules, "/wp-admin/x"), false);
  assert.equal(isAllowed(rules, "/wp-admin/admin-ajax.php"), true);
});

test("rules for other bots don't apply to us", () => {
  const rules = parseRobots("User-agent: GPTBot\nUser-agent: ClaudeBot\nDisallow: /\n\nUser-agent: *\nDisallow: /private\n");
  assert.equal(isAllowed(rules, "/events/"), true);
  assert.equal(isAllowed(rules, "/private/x"), false);
});

test("a full block and a group naming us are respected", () => {
  assert.equal(isAllowed(parseRobots("User-agent: *\nDisallow: /\n"), "/events/"), false);
  const ours = parseRobots("User-agent: *\nDisallow: /\n\nUser-agent: NearshoreAdventuresBot\nAllow: /\n");
  assert.equal(isAllowed(ours, "/events/"), true);
  assert.equal(isAllowed(parseRobots("User-agent: *\nDisallow: /*.pdf$\n"), "/a.pdf"), false);
  assert.equal(isAllowed(parseRobots("User-agent: *\nDisallow: /*.pdf$\n"), "/a.pdf.html"), true);
});
