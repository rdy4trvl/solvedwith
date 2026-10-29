#!/usr/bin/env node
// The review queue. One pass per case: approve, reject or flag.
// Run: node review.js   then open the URL it prints.
// Writes straight to data/cases.json and data/rejected.json. Nothing is deployed.
const fs = require("fs");
const http = require("http");
const site = require("./assets/site.js");

const PORT = 8899;
const CASES = "data/cases.json";
const REJECTED = "data/rejected.json";

const today = () => new Date().toISOString().slice(0, 10);
const read = f => JSON.parse(fs.readFileSync(f, "utf8"));
const write = (f, d) => fs.writeFileSync(f, JSON.stringify(d, null, 1) + "\n");

// The preview is the real page body, so what you approve is what ships.
function caseHTML(id) {
  const cases = read(CASES);
  site.setCases(cases);
  site.setFilter({});
  const c = cases.find(x => x.id === id);
  return c ? site.casePageHTML(c) : "<p>Gone.</p>";
}

function queue() {
  const cases = read(CASES);
  const rejected = fs.existsSync(REJECTED) ? read(REJECTED) : [];
  return {
    ids: cases.filter(c => c.status === "draft").map(c => c.id),
    total: cases.length + rejected.length,
    approved: cases.filter(c => c.status === "approved").length,
    flagged: cases.filter(c => c.status === "flagged").length,
    rejected: rejected.length,
  };
}

function decide(id, decision, note) {
  const cases = read(CASES);
  const i = cases.findIndex(c => c.id === id);
  if (i < 0) return { ok: false, error: "no such case" };
  const c = cases[i];
  const before = { status: c.status, revnote: c.revnote, revdate: c.revdate };

  if (decision === "reject") {
    const rejected = fs.existsSync(REJECTED) ? read(REJECTED) : [];
    c.status = "rejected"; c.revnote = note || ""; c.revdate = today();
    rejected.push(c);
    cases.splice(i, 1);
    write(REJECTED, rejected);
    write(CASES, cases);
    return { ok: true, undo: { id, kind: "reject", before } };
  }

  c.status = decision === "approve" ? "approved" : "flagged";
  c.revnote = decision === "flag" ? (note || "") : "";
  c.revdate = today();
  write(CASES, cases);
  return { ok: true, undo: { id, kind: decision, before } };
}

function undo(u) {
  if (!u) return { ok: false };
  if (u.kind === "reject") {
    const rejected = read(REJECTED);
    const j = rejected.findIndex(c => c.id === u.id);
    if (j < 0) return { ok: false };
    const c = rejected[j];
    rejected.splice(j, 1);
    Object.assign(c, u.before);
    const cases = read(CASES);
    cases.push(c);
    write(REJECTED, rejected);
    write(CASES, cases);
    return { ok: true };
  }
  const cases = read(CASES);
  const c = cases.find(x => x.id === u.id);
  if (!c) return { ok: false };
  Object.assign(c, u.before);
  write(CASES, cases);
  return { ok: true };
}

const SHELL = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Review queue</title>
<link rel="stylesheet" href="/assets/site.css">
<style>
body{padding-bottom:120px}
.bar{position:fixed;inset:auto 0 0 0;background:var(--surface);border-top:1px solid var(--line);
  padding:12px 20px;display:flex;gap:18px;align-items:center;flex-wrap:wrap;z-index:9}
.bar .keys{display:flex;gap:14px;flex-wrap:wrap;font:13px var(--body);color:var(--muted)}
.bar kbd{font:600 12px var(--mono);border:1px solid var(--line);border-bottom-width:2px;
  border-radius:4px;padding:1px 6px;color:var(--ink);background:var(--bg)}
.bar .prog{font:500 13px var(--mono);color:var(--muted);margin-left:auto;text-align:right}
.bar .prog b{color:var(--ink)}
.flash{position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:10;
  padding:10px 18px;border-radius:999px;font:600 14px var(--body);opacity:0;transition:opacity .15s}
.flash.on{opacity:1}
.flash.ok{background:var(--solved-soft);color:var(--solved)}
.flash.bad{background:var(--fail-soft);color:var(--fail)}
.flash.warn{background:var(--partial-soft);color:var(--partial)}
#preview a{pointer-events:none}
.done{padding:80px 20px;text-align:center;color:var(--muted)}
</style></head><body>
<div class="flash" id="flash"></div>
<div class="wrap"><main id="preview"></main></div>
<div class="bar">
  <div class="keys">
    <span><kbd>A</kbd> approve</span><span><kbd>R</kbd> reject</span><span><kbd>F</kbd> flag</span>
    <span><kbd>&darr;</kbd> skip</span><span><kbd>&uarr;</kbd> back</span><span><kbd>U</kbd> undo</span>
  </div>
  <div class="prog" id="prog"></div>
</div>
<script>
let ids=[], at=0, busy=false;
const $=s=>document.querySelector(s);
function flash(msg,kind){const f=$("#flash");f.textContent=msg;f.className="flash on "+kind;
  clearTimeout(f._t);f._t=setTimeout(()=>f.className="flash",1400);}
async function load(){
  const q=await (await fetch("/api/queue")).json();
  ids=q.ids;
  if(at>=ids.length)at=Math.max(0,ids.length-1);
  $("#prog").innerHTML=ids.length
    ? \`<b>\${q.approved}</b> approved · \${q.flagged} flagged · \${q.rejected} rejected<br><b>\${ids.length}</b> left of \${q.total}\`
    : \`<b>\${q.approved}</b> approved · \${q.flagged} flagged · \${q.rejected} rejected\`;
  if(!ids.length){$("#preview").innerHTML='<div class="done"><h1>Queue empty</h1><p>Nothing left to review.</p></div>';return;}
  $("#preview").innerHTML=await (await fetch("/api/case?id="+encodeURIComponent(ids[at]))).text();
  window.scrollTo(0,0);
}
async function send(decision,note){
  if(busy)return; busy=true;
  const id=ids[at];
  const r=await (await fetch("/api/decide",{method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({id,decision,note})})).json();
  if(!r.ok){busy=false;flash("Could not save","bad");return;}
  flash({approve:"Approved",reject:"Rejected",flag:"Flagged for rewrite"}[decision],
        {approve:"ok",reject:"bad",flag:"warn"}[decision]);
  await load();
  busy=false;
}
addEventListener("keydown",async e=>{
  if(e.metaKey||e.ctrlKey||e.altKey||busy)return;
  const k=e.key.toLowerCase();
  if(k==="arrowdown"||k==="arrowright"){e.preventDefault();if(at<ids.length-1){at++;load();}return;}
  if(k==="arrowup"||k==="arrowleft"){e.preventDefault();if(at>0){at--;load();}return;}
  if(!ids.length)return;
  if(k==="a"){e.preventDefault();send("approve");return;}
  if(k==="r"){e.preventDefault();const n=prompt("Why reject this case?");if(n!==null)send("reject",n);return;}
  if(k==="f"){e.preventDefault();const n=prompt("What needs rewriting?");if(n!==null)send("flag",n);return;}
  if(k==="u"){e.preventDefault();
    const r=await (await fetch("/api/undo",{method:"POST"})).json();
    flash(r.ok?"Undone":"Nothing to undo",r.ok?"warn":"bad");if(r.ok)await load();return;}
});
load();
</script></body></html>`;

const body = req => new Promise(res => { let b = ""; req.on("data", d => b += d); req.on("end", () => res(b)); });

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const send = (code, type, data) => { res.writeHead(code, { "content-type": type }); res.end(data); };
  try {
    if (url.pathname === "/") return send(200, "text/html; charset=utf-8", SHELL);
    if (url.pathname === "/assets/site.css") return send(200, "text/css; charset=utf-8", fs.readFileSync("assets/site.css"));
    if (url.pathname === "/api/queue") return send(200, "application/json", JSON.stringify(queue()));
    if (url.pathname === "/api/case") return send(200, "text/html; charset=utf-8", caseHTML(url.searchParams.get("id")));
    if (url.pathname === "/api/decide" && req.method === "POST") {
      const { id, decision, note } = JSON.parse(await body(req));
      const r = decide(id, decision, note);
      if (r.ok) global.__lastUndo = r.undo;
      return send(200, "application/json", JSON.stringify(r));
    }
    if (url.pathname === "/api/undo" && req.method === "POST") {
      const r = undo(global.__lastUndo);
      if (r.ok) global.__lastUndo = null;
      return send(200, "application/json", JSON.stringify(r));
    }
    send(404, "text/plain", "not found");
  } catch (e) {
    send(500, "text/plain", String(e && e.stack || e));
  }
}).listen(PORT, "127.0.0.1", () => {
  const q = queue();
  console.log(`Review queue: http://127.0.0.1:${PORT}/`);
  console.log(`${q.ids.length} to review · ${q.approved} approved · ${q.flagged} flagged · ${q.rejected} rejected`);
  console.log("Keys: A approve · R reject · F flag · arrows move · U undo · Ctrl+C to stop");
});
