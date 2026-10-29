# SolvedWith.ai

Real AI agent use cases, browsable by industry first, then by category.

## What is where

- `data/cases.json` — every case. The only place case content lives.
- `assets/site.js` — all page bodies and the browser behaviour. Edited once, used by both.
- `assets/site.css` — all styling.
- `build.js` — generates a real page per case, industry and category, plus `sitemap.xml` and `robots.txt`.
- `CLAUDE.md` — briefing for Claude Code: tag lists, data fields, rules.
- `CNAME`, `.nojekyll` — GitHub Pages config.

Generated output (`index.html`, `all/`, `case/`, `industry/`, `category/`, `404.html`) is committed
because Pages serves it straight from the branch. Don't hand-edit those files; they get overwritten.

## Changing anything

```
# edit data/cases.json, then:
node build.js
```

Then commit. Skipping the build means the site keeps serving the old pages.

## URLs

`/` · `/all/` · `/case/<id>/` · `/industry/<slug>/` · `/category/<slug>/`

These are permanent once live, same rule as category slugs. Old `#i-…`, `#c-…` and `#<case-id>`
links still work — the site redirects them to the new paths.

Status: phase 1a (private setup). Cases are samples until tagging is done and Doug has reviewed them.
