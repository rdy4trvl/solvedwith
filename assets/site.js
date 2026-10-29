const INDUSTRIES=[
["real-estate","Real estate & property"],["healthcare","Healthcare, clinics & dental"],["insurance","Insurance"],
["financial-services","Banking & financial services"],["accounting","Accounting, tax & bookkeeping"],["legal","Legal"],
["retail-ecommerce","Retail & e-commerce"],["restaurants-hospitality","Restaurants & hospitality"],["construction-trades","Construction & trades"],
["manufacturing","Manufacturing & supply chain"],["education","Education"],["marketing-agencies","Marketing & agencies"],
["media-publishing","Media & publishing"],["saas-tech","SaaS & technology"],["professional-services","Professional services & consulting"],
["recruiting","Recruiting & staffing"],["government","Government & public sector"],["cross-industry","Works in any industry"]];
const GROUPS=[
["Personal Life",[["money","Money & Investing"],["shopping","Shopping & Errands"],["travel","Travel, Bookings & Appointments"],["health","Health & Fitness"],["home","Home & Family"],["assistant","Personal Assistant & Paperwork"],["career","Jobs & Career"],["hobbies","Games & Hobbies"]]],
["Business",[["sales","Sales & Lead Generation"],["marketing","Marketing, SEO & Social"],["support","Customer Support"],["finance","Finance & Bookkeeping"],["hr","HR & Recruiting"],["operations","Operations & Admin"]]],
["Creative, Research & Learning",[["content","Content & Media"],["research","Research & Knowledge"],["teaching","Teaching & Learning"]]],
["Building & Tech",[["software","Software Development"],["agent-building","Agent Building & Orchestration"],["science","Security, Science & Hardware"]]]];
const byLabel=(a,b)=>a[1].localeCompare(b[1]);
INDUSTRIES.sort((a,b)=>a[0]==="cross-industry"?1:b[0]==="cross-industry"?-1:byLabel(a,b));
GROUPS.forEach(g=>g[1].sort(byLabel));
const CATS=Object.fromEntries(GROUPS.flatMap(g=>g[1]));
const IND=Object.fromEntries(INDUSTRIES);
const ROLES={individual:"Individual",smb:"Small-business owner",exec:"Executive / manager",marketer:"Marketer",sales:"Sales / BD",support:"Support lead",bookkeeper:"Finance / bookkeeper",recruiter:"Recruiter / HR",teacher:"Teacher",researcher:"Researcher",lawyer:"Lawyer",clinic:"Healthcare staff",realtor:"Real estate pro",seller:"E-commerce seller",developer:"Developer",nontech:"Non-technical builder",investor:"Investor"};
const TYPES={coding:"Coding agent",browser:"Browser / computer-use",personal:"Always-on personal agent",workflow:"Workflow automation",voice:"Voice / phone agent",chat:"Chat assistant + apps",research:"Deep research agent"};
const RISKS={money:"Spends money",accounts:"Accesses financial accounts",messages:"Sends messages as you",public:"Posts publicly",sensitive:"Handles sensitive personal data",data:"Changes or deletes data",code:"Runs code on your machine",legal:"Legal or tax consequences"};
const U={home:"/",all:"/all/",ind:k=>`/industry/${k}/`,cat:k=>`/category/${k}/`,case:id=>`/case/${id}/`};
const COSTS={free:"Free",low:"Under $20/mo",mid:"$20–100/mo",usage:"Usage-based, scales with volume",ent:"Enterprise / custom pricing"};
const EFFORT={1:["Try it now","Under 15 minutes; a prompt in a chat or browser agent"],2:["Short setup","Under 1 hour; connect accounts, no code"],3:["Weekend project","A few hours; scripts, schedules or self-hosting"],4:["Developer build","Multiple days; real code and deployment"]};

// Sample cases, summarized in our own words. Source/date values are placeholders.
let C=[];

const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const count=(f)=>C.filter(f).length;
const effortHTML=n=>`<span class="effort e${n}" title="${EFFORT[n][0]}">${[1,2,3,4].map(i=>`<i class="${i<=n?'on':''}"></i>`).join('')}</span>`;
const fmtDate=d=>d?new Date(d+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):"Date unknown";

function card(c){
  const riskB=c.risk.length?`<span class="b risk">${c.risk.length} risk${c.risk.length>1?'s':''}</span>`:`<span class="b safe">Low risk</span>`;
  const outB=c.out!=="Worked"?`<span class="b out-${c.out.replace(' ','')}">${c.out}</span>`:`<span class="b out-Worked">Worked</span>`;
  return `<a class="card" href="${U.case(c.id)}">
    <div class="badges"><span class="b ind-b">${esc(IND[c.ind[0]])}</span>${outB}</div>
    <h3>${esc(c.t)}</h3><p>${esc(c.s)}</p>
    <div class="badges">${effortHTML(c.eff)}<span class="b">${EFFORT[c.eff][0]}</span>${riskB}<span class="b">${esc(c.prod)}</span><span class="b">${c.src}</span></div>
  </a>`;
}

// ---- filter bar shared by list pages
let F={ind:"",role:"",type:"",eff:"",src:"",out:"",hide:[],sub:"",sort:"new",q:""};
function resetF(o){F={ind:"",role:"",type:"",eff:"",src:"",out:"",hide:[],sub:"",sort:"new",q:"",...o};}
function applyF(list){
  let r=list.filter(c=>(!F.ind||c.ind.includes(F.ind))&&(!F.role||c.roles.includes(F.role))&&(!F.type||c.type.includes(F.type))&&(!F.eff||c.eff<=+F.eff)&&(!F.src||c.src===F.src)&&(!F.out||c.out===F.out)&&(!F.sub||c.sub===F.sub)&&!F.hide.some(h=>c.risk.includes(h)));
  if(F.q){const q=F.q.toLowerCase();r=r.filter(c=>(c.t+" "+c.s+" "+c.prod+" "+c.ind.map(i=>IND[i]).join(" ")).toLowerCase().includes(q));}
  if(F.sort==="easy")r.sort((a,b)=>a.eff-b.eff);
  else if(F.sort==="risk")r.sort((a,b)=>a.risk.length-b.risk.length);
  else r.sort((a,b)=>b.added.localeCompare(a.added));
  return r;
}
const opt=(obj,sel,all)=>`<option value="">${all}</option>`+Object.entries(obj).map(([k,v])=>`<option value="${k}"${sel===k?' selected':''}>${esc(v)}</option>`).join('');
function jumpNav(cur,openInd=true){
  const li=(h,label,on)=>`<li><a href="${h}"${on?' aria-current="page"':''}>${esc(label)}</a></li>`;
  const inds=INDUSTRIES.map(([k,v])=>li(U.ind(k),v,cur===`i-${k}`)).join('');
  const cats=GROUPS.map(([g,cs])=>`<li class="g"><span class="eyebrow">${esc(g)}</span></li>`+cs.map(([k,v])=>li(U.cat(k),v,cur===`c-${k}`)).join('')).join('');
  return `<nav class="jump" aria-label="Browse everything">
    <details${openInd?" open":""}><summary>All industries</summary><ul>${inds}</ul></details>
    <details><summary>All categories</summary><ul>${cats}</ul></details></nav>`;
}
function filterBar(lockInd){
  const indOpts=Object.fromEntries(INDUSTRIES);
  const srcs=[...new Set(C.map(c=>c.src))].sort();
  return `<form class="filters" id="fbar" onsubmit="return false">
    ${lockInd?'':`<label for="f-ind">Industry<select id="f-ind" data-k="ind">${opt(indOpts,F.ind,"All industries")}</select></label>`}
    <label for="f-role">Role<select id="f-role" data-k="role">${opt(ROLES,F.role,"Any role")}</select></label>
    <label for="f-type">Agent type<select id="f-type" data-k="type">${opt(TYPES,F.type,"Any type")}</select></label>
    <label for="f-eff">Effort<select id="f-eff" data-k="eff">${opt({1:"Try it now only",2:"Up to short setup",3:"Up to weekend project",4:"Any, incl. developer builds"},F.eff,"Any effort")}</select></label>
    <fieldset><legend>Hide cases that…</legend>${Object.entries(RISKS).map(([k,v])=>`<label class="check" for="h-${k}"><input type="checkbox" id="h-${k}" data-h="${k}"${F.hide.includes(k)?' checked':''}> ${esc(v.toLowerCase())}</label>`).join('')}</fieldset>
    <label for="f-out">Outcome<select id="f-out" data-k="out">${opt({Worked:"Worked",Partial:"Partial","Not reported":"Not reported",Failed:"Failed"},F.out,"Any outcome")}</select></label>
    <label for="f-src">Source<select id="f-src" data-k="src">${opt(Object.fromEntries(srcs.map(s=>[s,s])),F.src,"Any source")}</select></label>
    <button type="button" class="btn ghost" id="f-clear">Clear filters</button>
  </form>`;
}
function listHTML(base,cap){
  const r=applyF(base);
  const shown=cap&&r.length>cap?r.slice(0,cap):r;
  return `<div class="listhead"><span class="count">${r.length} of ${base.length} cases</span>
    <label for="f-sort" class="count">Sort <select id="f-sort">${[["new","Newest added"],["easy","Easiest first"],["risk","Lowest risk first"]].map(([k,v])=>`<option value="${k}"${F.sort===k?' selected':''}>${v}</option>`).join('')}</select></label></div>
    ${r.length?`<div class="cards">${shown.map(card).join('')}</div>`:`<div class="empty">No cases match these filters yet. Try clearing one.</div>`}`;
}
function wireList(base,lockInd,keep){
  const rerender=()=>{$("#list").innerHTML=listHTML(base);$("#f-sort").onchange=e=>{F.sort=e.target.value;rerender();};};
  document.querySelectorAll("#fbar select").forEach(s=>s.onchange=()=>{F[s.dataset.k]=s.value;rerender();});
  document.querySelectorAll("#fbar [data-h]").forEach(x=>x.onchange=()=>{F.hide=x.checked?[...F.hide,x.dataset.h]:F.hide.filter(h=>h!==x.dataset.h);rerender();});
  $("#f-clear").onclick=()=>{resetF(keep);render();};
  document.querySelectorAll("[data-sub]").forEach(b=>b.onclick=()=>{F.sub=F.sub===b.dataset.sub?"":b.dataset.sub;document.querySelectorAll("[data-sub]").forEach(x=>x.setAttribute("aria-pressed",x.dataset.sub===F.sub));rerender();});
  rerender();
}

// ---- pages
function newsletter(){
  const indChips=INDUSTRIES.filter(i=>i[0]!=="cross-industry").map(([k,v])=>`<button type="button" class="chip" data-nl="${k}" aria-pressed="false">${esc(v)}</button>`).join('');
  return `<section class="news" id="nl"><div class="sec-head"><h2>The weekly SolvedWith digest</h2></div>
  <p class="note">Five new cases a week from the industries you pick. Each with what it took, what it risked, and whether it worked.</p>
  <div class="chips">${indChips}</div>
  <form class="row" id="nl-form"><input type="email" id="nl-email" required placeholder="you@company.com" aria-label="Email address"><button class="btn" type="submit">Subscribe</button></form>
  <p class="note" id="nl-msg">No picks means every industry.</p></section>`;
}
function wireNews(pre){
  const picked=new Set(pre?[pre]:[]);
  document.querySelectorAll("[data-nl]").forEach(b=>{b.setAttribute("aria-pressed",picked.has(b.dataset.nl));b.onclick=()=>{picked.has(b.dataset.nl)?picked.delete(b.dataset.nl):picked.add(b.dataset.nl);b.setAttribute("aria-pressed",picked.has(b.dataset.nl));};});
  $("#nl-form").onsubmit=e=>{e.preventDefault();const m=$("#nl-msg");m.className="ok";m.textContent=`Prototype only: signup isn't connected yet. This would subscribe ${$("#nl-email").value} to ${picked.size?[...picked].map(k=>IND[k]).join(", "):"every industry"}.`;};
}

function homeHTML(){
  const tile=([k,v],extra)=>{const n=count(c=>c.ind.includes(k));return `<a class="ind${extra}${n<1?' thin':''}" href="${U.ind(k)}"><span>${esc(v)}</span><span class="n">${n}</span></a>`;};
  const indTiles=INDUSTRIES.filter(([k])=>k!=="cross-industry").map(i=>tile(i,'')).join('');
  const anyTile=tile(INDUSTRIES.find(([k])=>k==="cross-industry"),' any');
  const groups=GROUPS.map(([g,cats])=>`<div class="group"><span class="eyebrow">${g}</span><ul>${cats.map(([k,v])=>`<li><a href="${U.cat(k)}">${esc(v)}<span>${count(c=>c.cat===k)}</span></a></li>`).join('')}</ul></div>`).join('');
  const newest=[...C].sort((a,b)=>b.added.localeCompare(a.added)).slice(0,6);
  const easy=C.filter(c=>c.eff===1&&c.risk.length<=1).slice(0,6);
  return `
  <section class="hero"><span class="eyebrow">${C.length} real cases · ${INDUSTRIES.length-1} industries · 20 categories</span>
    <h1>What AI agents can do in your industry</h1>
    <p>Real use cases with setup, results and risks.</p>
    <form class="search" id="hs"><input id="hs-q" type="search" placeholder="Try invoices, appointments, SEO…" aria-label="Search cases"><button class="btn" type="submit">Search</button></form>
  </section>
  <section class="sec" id="industries"><div class="sec-head"><h2>Browse by industry</h2><p>Cases that only apply to your field, then the ones that work anywhere.</p></div><div class="ind-grid scroller" id="ind-grid" tabindex="0" role="group" aria-label="All industries, scroll for more">${indTiles}</div><div class="any-row">${anyTile}</div></section>
  <section class="sec" id="categories"><div class="sec-head"><h2>Browse by category</h2></div><div class="panel"><div class="groups">${groups}</div></div></section>
  <section class="sec"><div class="sec-head"><h2>New this week</h2><a href="${U.all}">All cases</a></div><div class="cards">${newest.map(card).join('')}</div></section>
  <section class="sec"><div class="sec-head"><h2>Easy wins</h2><p>Under 15 minutes to try, with little or no risk.</p></div><div class="cards">${easy.map(card).join('')}</div></section>
  ${newsletter()}`;
}
function wireHome(){
  $("#hs").onsubmit=e=>{e.preventDefault();const q=$("#hs-q").value.trim();location.href=q?`${U.all}?q=${encodeURIComponent(q)}`:U.all;};
  wireNews();
}

// one context builder so the generator and the browser render the same list pages
function listCtx(kind,key){
  if(kind==="i"){
    const own=C.filter(c=>c.ind.includes(key));
    const fns=new Set(own.map(c=>c.cat));
    const anyInd=key==="cross-industry"?[]:C.filter(c=>c.ind.includes("cross-industry")||(!c.ind.includes(key)&&fns.has(c.cat)&&c.ind.length>1));
    const catsHere=[...new Set(own.map(c=>c.cat))];
    const head=`<div class="pagehead"><div class="crumbs"><a href="${U.home}">Home</a> / <a href="${U.home}#industries">Industries</a></div>
      <span class="eyebrow">Industry</span><h1>Solved with AI in ${esc(IND[key])}</h1>
      <p>${own.length} case${own.length===1?'':'s'} from this industry${catsHere.length?`, across ${catsHere.length} categor${catsHere.length===1?'y':'ies'}`:''}. <a href="#nl" id="nl-jump">Get this industry's newsletter</a></p>
      ${catsHere.length?`<div class="chips">${catsHere.map(k=>`<a class="chip" href="${U.cat(k)}">${esc(CATS[k])}</a>`).join('')}</div>`:''}</div>`;
    const extra=anyInd.length?`<section class="sec" style="margin-top:32px"><div class="sec-head"><h2>Also works in any industry</h2><p>Same kinds of jobs, from other fields.</p></div><div class="cards">${anyInd.slice(0,6).map(card).join('')}</div></section>`:'';
    return {base:own,head,extra,lockInd:true,cur:"i-"+key,news:true};
  }
  if(kind==="c"){
    const base=C.filter(c=>c.cat===key);
    const subs=[...new Set(base.map(c=>c.sub))];
    const head=`<div class="pagehead"><div class="crumbs"><a href="${U.home}">Home</a> / <a href="${U.home}#categories">Categories</a></div>
      <span class="eyebrow">${GROUPS.find(g=>g[1].some(x=>x[0]===key))[0]}</span><h1>${esc(CATS[key])}</h1>
      <p>${base.length} case${base.length===1?'':'s'}. Filter by your industry to see only what applies to you.</p>
      ${subs.length?`<div class="chips">${subs.map(x=>`<button type="button" class="chip" data-sub="${esc(x)}" aria-pressed="${F.sub===x}">${esc(x)}</button>`).join('')}</div>`:''}</div>`;
    return {base,head,extra:'',lockInd:false,cur:"c-"+key,news:false};
  }
  const head=`<div class="pagehead"><div class="crumbs"><a href="${U.home}">Home</a></div><h1>All cases</h1>${F.q?`<p>Searching for “${esc(F.q)}”. <a href="${U.all}" id="clr-q">Clear search</a></p>`:''}</div>`;
  return {base:C,head,extra:'',lockInd:false,cur:"",news:false};
}
function listPageHTML(kind,key,cap){
  const x=listCtx(kind,key);
  return `${x.head}<div class="layout"><div class="rail">${filterBar(x.lockInd)}${jumpNav(x.cur)}</div><div><div id="list">${listHTML(x.base,cap)}</div>${x.extra}</div></div>${x.news?newsletter():''}`;
}
function wireListPage(kind,key){
  const x=listCtx(kind,key);
  wireList(x.base,x.lockInd,{});
  if(x.news)wireNews(key==="cross-industry"?null:key);
  const q=$("#clr-q");if(q)q.onclick=e=>{e.preventDefault();F.q="";history.replaceState(null,"",U.all);render();};
}

function casePageHTML(c){
  const related=C.filter(x=>x.id!==c.id&&(x.sub===c.sub||x.ind.some(i=>c.ind.includes(i)))).slice(0,4);
  return `<div class="crumbs"><a href="${U.home}">Home</a> / <a href="${U.ind(c.ind[0])}">${esc(IND[c.ind[0]])}</a> / <a href="${U.cat(c.cat)}">${esc(CATS[c.cat])}</a></div>
  <div class="casepage"><article class="prose">
    <div class="badges">${c.ind.map(i=>`<a class="b ind-b" href="${U.ind(i)}">${esc(IND[i])}</a>`).join('')}<span class="b out-${c.out.replace(' ','')}">${c.out}</span></div>
    <h1>${esc(c.t)}</h1><p style="font-size:17px;color:var(--muted)">${esc(c.s)}</p>
    <section class="sec"><h2>What they did</h2><p>${esc(c.did)}</p></section>
    <section class="sec"><h2>How it went</h2><p>${esc(c.how)}</p></section>
    ${ourRead(c)}
    <section class="sec">
      <div class="sec-head"><h2>Try it</h2><button class="btn ghost" id="copy">Copy prompt</button></div>
      <p class="note">A starting prompt we build from this case. Not the original poster's wording.</p>
      <pre class="prompt" id="tp">${esc(promptFor(c))}</pre></section>
  </article>
  <aside class="side">
    <div class="box"><h3>Setup</h3><dl>
      <dt>Effort</dt><dd>${effortHTML(c.eff)} ${EFFORT[c.eff][0]}<br><span class="note">${EFFORT[c.eff][1]}</span></dd>
      <dt>Cost</dt><dd>${c.cost?esc(COSTS[c.cost]||c.cost):"Not reported"}</dd>
      <dt>Agent type</dt><dd>${c.type.map(t=>TYPES[t]).join(", ")}</dd>
      <dt>Product</dt><dd>${esc(c.prod)}</dd>
      <dt>Before you start</dt><dd>${c.pre&&c.pre.length?c.pre.map(esc).join(" · "):"Nothing beyond the product above"}</dd>
      <dt>For</dt><dd>${c.roles.map(r=>ROLES[r]).join(", ")}</dd>
      <dt>Category</dt><dd><a href="${U.cat(c.cat)}">${esc(CATS[c.cat])}</a> · ${esc(c.sub)}</dd></dl></div>
    <div class="box"><h3>What it can touch</h3>
      ${c.risk.length?`<ul class="risklist">${c.risk.map(r=>`<li><span class="b risk">${RISKS[r]}</span></li>`).join('')}</ul>`:`<span class="b safe">No risk labels</span>`}
      <p class="note">${c.appr?"A person approves before it acts.":"No human approval step described."}</p></div>
    <div class="box"><h3>Source</h3><dl>
      <dt>From</dt><dd><span class="b">${c.src}</span></dd>
      <dt>Posted</dt><dd>${fmtDate(c.posted)}</dd>
      <dt>Added</dt><dd>${fmtDate(c.added)}</dd></dl>
      <p class="note">Original link is added during tagging.</p></div>
    ${jumpNav("i-"+c.ind[0],false)}
  </aside></div>
  ${related.length?`<section class="sec"><h2>Related cases</h2><div class="cards">${related.map(card).join('')}</div></section>`:''}`;
}
function ourRead(c){
  const lim=c.limits||[], ide=c.ideas||[];
  if(!lim.length&&!ide.length)return "";
  const list=a=>`<ul>${a.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`;
  return `<section class="sec read">
    <div class="sec-head"><h2>Our read</h2><span class="eyebrow">Our analysis${c.evaluated?` · ${fmtDate(c.evaluated)}`:""}</span></div>
    <p class="note">Not from the source. Our own assessment of the approach, which may date as the tools change.</p>
    ${lim.length?`<div><h3>Where it falls down</h3>${list(lim)}</div>`:""}
    ${ide.length?`<div><h3>Worth trying next</h3>${list(ide)}</div>`:""}
  </section>`;
}
function wireCasePage(){
  $("#copy").onclick=async()=>{const t=$("#tp").textContent;try{await navigator.clipboard.writeText(t);$("#copy").textContent="Copied";}catch(e){const r=document.createRange();r.selectNodeContents($("#tp"));const s=getSelection();s.removeAllRanges();s.addRange(r);$("#copy").textContent="Selected: press Ctrl+C";}};
}
function promptFor(c){return `I work in ${IND[c.ind[0]].toLowerCase()} and want to ${c.t.charAt(0).toLowerCase()+c.t.slice(1)}.\nWalk me through setting this up with ${c.prod==="Custom"?"an AI agent":c.prod}, step by step.\nBefore anything that ${c.risk.length?c.risk.map(r=>RISKS[r].toLowerCase()).join(" or "):"changes something"}, stop and ask me first.`;}

// ---- browser bootstrap. Every page is a real file; data-page says which one.
function render(){
  const p=document.body.dataset.page||"home", k=document.body.dataset.key||"";
  if(p==="case"){const c=C.find(x=>x.id===k);
    if(!c){$("#app").innerHTML='<div class="empty">That case is no longer listed.</div>';return;}
    $("#app").innerHTML=casePageHTML(c);wireCasePage();return;}
  if(p==="industry"){$("#app").innerHTML=listPageHTML("i",k);wireListPage("i",k);return;}
  if(p==="category"){$("#app").innerHTML=listPageHTML("c",k);wireListPage("c",k);return;}
  if(p==="all"){$("#app").innerHTML=listPageHTML("a","");wireListPage("a","");return;}
  $("#app").innerHTML=homeHTML();wireHome();
  const h=location.hash.slice(1);
  if(h){const el=document.getElementById(h==="newsletter"?"nl":h);if(el)el.scrollIntoView();}
}
// Links shared before the move to real paths still arrive as #i-x, #c-x or #case-id.
function redirectLegacyHash(){
  const h=decodeURIComponent(location.hash.slice(1));
  if(!h||["home","industries","categories","newsletter","nl"].includes(h))return false;
  if(h==="all"){location.replace(U.all);return true;}
  if(h.startsWith("i-")&&IND[h.slice(2)]){location.replace(U.ind(h.slice(2)));return true;}
  if(h.startsWith("c-")&&CATS[h.slice(2)]){location.replace(U.cat(h.slice(2)));return true;}
  if(C.some(x=>x.id===h)){location.replace(U.case(h));return true;}
  return false;
}
if(typeof window!=="undefined"&&typeof document!=="undefined"){
  if(document.body.dataset.page==="all"){F.q=new URLSearchParams(location.search).get("q")||"";}
  window.addEventListener("hashchange",redirectLegacyHash);
  fetch("/data/cases.json").then(r=>r.json()).then(d=>{C=d;if(!redirectLegacyHash())render();})
    .catch(()=>{$("#app").innerHTML='<div class="empty">Could not load the case list. Refresh to try again.</div>';});
}
if(typeof module!=="undefined"&&module.exports){
  module.exports={setCases:d=>{C=d;},setFilter:o=>{resetF(o);},homeHTML,listPageHTML,casePageHTML,promptFor,
    INDUSTRIES,GROUPS,CATS,IND,U,esc};
}
