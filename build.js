#!/usr/bin/env node
// Generates one real page per case, industry and category from data/cases.json.
// The page bodies come from assets/site.js, so the generator and the browser
// can never drift apart. Run: node build.js
const fs = require("fs");
const path = require("path");

const ORIGIN = "https://solvedwith.ai";
// Crawlers reach every case through its own page and the sitemap, so the
// pre-rendered lists only need enough to be useful without JS.
const STATIC_LIST_CAP = 60;
const site = require("./assets/site.js");
const { setCases, setFilter, homeHTML, listPageHTML, casePageHTML, INDUSTRIES, GROUPS, CATS, IND, U, esc } = site;

// Phase 1a: drafts still publish so the samples stay live. At go-live set this
// to false and only cases Doug approved in the review queue will ship.
const PUBLISH_DRAFTS = true;

const all = JSON.parse(fs.readFileSync("data/cases.json", "utf8"));
const cases = PUBLISH_DRAFTS ? all : all.filter(c => c.status === "approved");
if (cases.length !== all.length) console.log(`${all.length - cases.length} unapproved cases held back`);
setCases(cases);

const clip = (s, n = 155) => {
  s = String(s).replace(/\s+/g, " ").trim();
  return s.length <= n ? s : s.slice(0, s.lastIndexOf(" ", n - 1)) + "…";
};

function shell({ title, desc, url, page, key = "", body, js = true }) {
  const abs = ORIGIN + url;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(abs)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="SolvedWith.ai">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(abs)}">
<meta name="twitter:card" content="summary">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Instrument+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="/assets/site.css">
</head><body data-page="${page}"${key ? ` data-key="${esc(key)}"` : ""}>

<div class="banner"><div class="wrap">Layout prototype · ${cases.length} sample cases summarized from the review · source badges, dates and links are placeholders until tagging</div></div>
<header class="top"><div class="wrap">
  <a class="logo" href="/"><svg class="mark" viewBox="0 0 64 64" fill="none" aria-hidden="true"><g stroke="var(--solved)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"><circle cx="32" cy="32" r="24" stroke-dasharray="125.7 25.1" transform="rotate(-12 32 32)"/><path d="M19 33.5 28.5 43 52 14"/></g></svg>SolvedWith<span class="tld">.ai</span></a>
  <nav class="main"><a href="/#industries">Industries</a><a href="/#categories">Categories</a><a href="${U.all}">All cases</a><a href="/#newsletter">Newsletter</a></nav>
</div></header>
<div class="wrap"><main id="app">${body}</main></div>
<footer><div class="wrap"><span>SolvedWith.ai · real AI agent use cases, by industry</span><span>Contact: problem@solvedwith.ai</span></div></footer>
${js ? '<script src="/assets/site.js"></script>' : ""}
</body></html>
`;
}

// Generated output is rebuilt from scratch: a rejected or renamed case must not
// leave its old page behind, still served and still in search results.
for (const dir of ["case", "industry", "category", "all"]) {
  fs.rmSync(dir, { recursive: true, force: true });
}

let written = 0;
function emit(urlPath, html) {
  const file = urlPath === "/" ? "index.html" : path.join(urlPath.replace(/^\/|\/$/g, ""), "index.html");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  written++;
}

const urls = [];
const add = (loc, lastmod) => urls.push({ loc: ORIGIN + loc, lastmod });

// ---- home
setFilter({});
emit("/", shell({
  title: "SolvedWith.ai — what AI agents can do in your industry",
  desc: "Real AI agent use cases with setup, results and risks. Browse by industry first, then by category.",
  url: "/", page: "home", body: homeHTML(),
}));
add("/");

// ---- all cases
setFilter({});
emit(U.all, shell({
  title: "All AI agent use cases — SolvedWith.ai",
  desc: `Every one of the ${cases.length} cases, filterable by industry, role, agent type, effort and risk.`,
  url: U.all, page: "all", body: listPageHTML("a", "", STATIC_LIST_CAP),
}));
add(U.all);

// ---- industries
for (const [slug, label] of INDUSTRIES) {
  setFilter({});
  const n = cases.filter(c => c.ind.includes(slug)).length;
  const isAny = slug === "cross-industry";
  emit(U.ind(slug), shell({
    title: `AI agents in ${label} — SolvedWith.ai`,
    desc: clip(isAny
      ? `AI agent use cases that work in any industry. ${n} real example${n === 1 ? "" : "s"}, each with what it took to set up, what it can touch and whether it worked.`
      : `${n} real AI agent use case${n === 1 ? "" : "s"} in ${label.toLowerCase()}, each with what it took to set up, what it can touch and whether it worked.`),
    url: U.ind(slug), page: "industry", key: slug, body: listPageHTML("i", slug, STATIC_LIST_CAP),
  }));
  add(U.ind(slug));
}

// ---- categories
for (const [group, cats] of GROUPS) {
  for (const [slug, label] of cats) {
    setFilter({});
    const n = cases.filter(c => c.cat === slug).length;
    emit(U.cat(slug), shell({
      title: `${label} — AI agent use cases — SolvedWith.ai`,
      desc: clip(`${n} AI agent use case${n === 1 ? "" : "s"} for ${label.toLowerCase()} (${group.toLowerCase()}), each with setup effort, what it can touch and whether it worked.`),
      url: U.cat(slug), page: "category", key: slug, body: listPageHTML("c", slug, STATIC_LIST_CAP),
    }));
    add(U.cat(slug));
  }
}

// ---- cases
for (const c of cases) {
  setFilter({});
  emit(U.case(c.id), shell({
    title: `${c.t} — SolvedWith.ai`,
    desc: clip(c.s),
    url: U.case(c.id), page: "case", key: c.id, body: casePageHTML(c),
  }));
  add(U.case(c.id), c.added || undefined);
}

// ---- 404: static, no script, so it works at any depth
fs.writeFileSync("404.html", shell({
  title: "Page not found — SolvedWith.ai",
  desc: "That page is not here.",
  url: "/404.html", page: "notfound", js: false,
  body: `<div class="pagehead"><span class="eyebrow">404</span><h1>That page is not here</h1>
  <p>The link may be old, or the case may have been renamed.</p>
  <div class="chips"><a class="chip" href="/">Home</a><a class="chip" href="${U.all}">All cases</a></div></div>`,
}));
written++;

// ---- sitemap + robots
fs.writeFileSync("sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map(u => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`).join("\n") +
  `\n</urlset>\n`);

fs.writeFileSync("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);

console.log(`${written} pages · ${urls.length} sitemap urls · ${cases.length} cases`);
