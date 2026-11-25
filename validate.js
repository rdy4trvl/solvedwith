#!/usr/bin/env node
// Checks data/cases.json against the rules in CLAUDE.md before anything is built.
// Run: node validate.js   Exits non-zero if anything is wrong, so build.js can refuse.
const fs = require("fs");
const site = require("./assets/site.js");
const { INDUSTRIES, GROUPS, CATS, IND, ROLES, TYPES, RISKS, COSTS, EFFORT } = site;

const SRC = ["Reddit", "X", "Hacker News", "Bluesky", "GitHub", "YouTube", "LinkedIn",
             "Blog", "News media", "Company case study", "Community submission"];
const OUT = ["Worked", "Partial", "Failed", "Not reported"];
const STATUS = ["draft", "approved", "flagged"];

const cases = JSON.parse(fs.readFileSync("data/cases.json", "utf8"));
const problems = [];
const seenId = new Map(), seenUrl = new Map();

const isDate = v => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v);
const strList = v => Array.isArray(v) && v.every(x => typeof x === "string" && x.trim());

for (const [n, c] of cases.entries()) {
  const where = c.id || `#${n + 1}`;
  const bad = m => problems.push(`${where}: ${m}`);

  if (!c.id || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(c.id)) bad("id must be a lowercase slug");
  if (seenId.has(c.id)) bad(`duplicate id, also at #${seenId.get(c.id) + 1}`);
  else seenId.set(c.id, n);

  // The rule the first 28 broke: no source, no case.
  if (!c.url) bad("no source url - every case must link to where it was reported");
  else if (!/^https?:\/\/\S+$/.test(c.url)) bad(`url is not a link: ${c.url}`);
  else if (seenUrl.has(c.url)) bad(`same source as ${seenUrl.get(c.url)} - duplicate case?`);
  else seenUrl.set(c.url, c.id);

  if (!c.t) bad("missing title");
  else if (c.t.length >= 70) bad(`title is ${c.t.length} chars, must be under 70`);
  for (const f of ["s", "did", "how", "sub", "prod"]) if (!c[f]) bad(`missing ${f}`);

  if (!OUT.includes(c.out)) bad(`out "${c.out}" is not one of ${OUT.join(" | ")}`);
  if (!SRC.includes(c.src)) bad(`src "${c.src}" is not a source badge`);
  if (!STATUS.includes(c.status)) bad(`status "${c.status}" is not one of ${STATUS.join(" | ")}`);
  if (!COSTS[c.cost]) bad(`cost "${c.cost}" is not a cost slug`);
  if (!EFFORT[c.eff]) bad(`eff "${c.eff}" must be 1-4`);
  if (typeof c.appr !== "boolean") bad("appr must be true or false");
  if (!isDate(c.posted)) bad(`posted "${c.posted}" is not YYYY-MM-DD`);
  if (!isDate(c.added) || !c.added) bad(`added "${c.added}" is not YYYY-MM-DD`);
  if (!isDate(c.evaluated)) bad(`evaluated "${c.evaluated}" is not YYYY-MM-DD`);

  if (!Array.isArray(c.ind) || !c.ind.length) bad("needs at least one industry");
  else for (const k of c.ind) if (!IND[k]) bad(`unknown industry "${k}"`);
  if (!CATS[c.cat]) bad(`unknown category "${c.cat}"`);
  for (const [k, list, name] of [[c.roles, ROLES, "role"], [c.type, TYPES, "agent type"], [c.risk, RISKS, "risk"]]) {
    if (!Array.isArray(k)) { bad(`${name}s must be a list`); continue; }
    for (const v of k) if (!list[v]) bad(`unknown ${name} "${v}"`);
  }
  if (!c.roles?.length) bad("needs at least one role");
  if (!c.type?.length) bad("needs at least one agent type");

  for (const f of ["pre", "limits", "ideas"]) {
    if (!strList(c[f])) bad(`${f} must be a list of non-empty strings`);
  }
  if (c.limits?.length && !c.evaluated) bad("has limits but no evaluated date");
}

if (problems.length) {
  console.error(`FAILED - ${problems.length} problem(s) in ${cases.length} case(s):\n`);
  for (const p of problems) console.error("  " + p);
  console.error("");
  process.exit(1);
}
console.log(`OK - ${cases.length} case(s), all sourced, all slugs known`);
