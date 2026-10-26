import {createStudy} from "./study-ui.mjs";
import {normalizeStudy,prefilledPlans} from "./study-domain.mjs";
import {normalizeCareer} from "./career-domain.mjs";
import {localDate,addDays,qualified,reviewState,latestDesign,summarize,initialState,exportBackup,validateSettings,validateBackup,validateLegacy,mergeBackup,safeUrl} from "./domain.mjs";
import {openStore,readState,writeState} from "./store.mjs";
const seed=window.CURRICULUM;
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const paths={
 home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
 code:'<path d="m8 5-6 7 6 7m8-14 6 7-6 7m-3-16-2 18"/>',
 repeat:'<path d="M20 7H7a4 4 0 0 0-4 4m17-4-4-4m4 4-4 4M4 17h13a4 4 0 0 0 4-4M4 17l4-4m-4 4 4 4"/>',
 map:'<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Zm6-2v16m6-14v16"/>',
 design:'<rect x="8" y="2" width="8" height="6" rx="1"/><rect x="2" y="16" width="7" height="6" rx="1"/><rect x="15" y="16" width="7" height="6" rx="1"/><path d="M12 8v4M5.5 16v-4h13v4"/>',
 java:'<path d="M4 9h12v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4ZM16 10h2a3 3 0 0 1 0 6h-2M7 2v3m5-3v3M2 23h18"/>',
 chart:'<path d="M3 3v18h18M7 16v-4m5 4V6m5 10V9"/>',
 history:'<path d="M3 11a9 9 0 1 1 2 7M3 4v7h7m2-4v5l3 2"/>',
 settings:'<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="10" cy="18" r="2"/>',
 arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',chevron:'<path d="m9 5 7 7-7 7"/>',
 check:'<path d="m5 12 4 4L19 6"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 flame:'<path d="M12 2c1 5 6 7 6 12a6 6 0 0 1-12 0c0-3 2-6 4-7 0 3 2 4 2 4s2-5 0-9Z"/>',
 search:'<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/>',
 close:'<path d="m6 6 12 12M6 18 18 6"/>',
 plus:'<path d="M12 4v16M4 12h16"/>',
 download:'<path d="M12 2v13m-5-5 5 5 5-5M4 16v5h16v-5"/>',
 upload:'<path d="M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5"/>',
 spark:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5ZM21 2v4m-2-2h4"/>',
 shield:'<path d="m12 2 8 3v6c0 5-4 9-8 11-4-2-8-6-8-11V5Z"/><path d="m8 12 3 3 5-6"/>',
 pause:'<path d="M8 5v14m8-14v14"/>',play:'<path d="m8 4 12 8-12 8Z"/>',
 book:'<path d="M12 5C8 2 4 3 2 4v16c4-2 7-1 10 1 3-2 6-3 10-1V4c-2-1-6-2-10 1Zm0 0v16"/>',
 menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
 dot:'<circle cx="12" cy="12" r="3"/>',
 external:'<path d="M14 3h7v7m0-7L10 14M10 3H3v18h18v-7"/>',
 leaf:'<path d="M20 3C6 2 1 9 5 16c4 7 16 2 15-13ZM5 21l10-12"/>'
};
function icon(name,size=20){return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.dot}</svg>`}
const nav=[["practice","code","DSA Sheet"],["design","design","System Design"],["planner","map","Daily Planner"],["reviews","repeat","Revision"],["history","history","Activity history"],["settings","settings","Settings & backups"]];
let db,state,summary,view=location.hash.slice(1)||"practice",dirty=false,saving=false,storageError="",channel;
let filters={query:"",module:"all",track:"Core",difficulty:"all",status:"all"};
let designWeek=1,selectedProblem=null,javaContext=null,importCandidate=null;
let timer={remaining:25*60,total:25*60,running:false,endsAt:null},timerInterval;
const getToday=()=>localDate(new Date(),state.settings.timezone);
const dateLabel=d=>d?new Intl.DateTimeFormat("en",{day:"numeric",month:"short",timeZone:"UTC"}).format(new Date(d+"T12:00:00Z")):"—";
const duration=n=>n>=60?`${Math.floor(n/60)}h ${n%60?Math.round(n%60)+"m":""}`:`${Math.round(n)}m`;
const currentWeek=()=>seed.roadmap.find(w=>w.week===state.settings.activeWeek);
function toast(message,type="success"){
  const el=document.createElement("div");el.className=`toast ${type}`;el.textContent=message;$("#toasts").append(el);
  setTimeout(()=>el.remove(),5000);
}
async function commit(change){
  if(saving)throw new Error("A save is already in progress.");
  saving=true;setSaveLabel("Saving…");
  try{
    const next=structuredClone(state);await change(next);
    state=await writeState(db,next,state.revision);storageError="";
    channel?.postMessage({revision:state.revision});return true;
  }catch(e){storageError=e.message;toast(e.message,"error");throw e}
  finally{saving=false;setSaveLabel(storageError?"Save needs attention":"Saved locally")}
}
function setSaveLabel(text){const el=$("#save-label");if(el)el.textContent=text}
function badge(text,cls=""){return `<span class="badge ${cls}">${esc(text)}</span>`}
function outcomeBadge(r){return badge(r.retained?"Retained":r.outcome,r.retained||r.outcome==="Solved independently"?"green":r.outcome==="Solved with help"?"orange":r.outcome==="Attempted"?"violet":"neutral")}
function progressBar(value,total,cls=""){return `<div class="progress-track ${cls}" role="progressbar" aria-label="Progress" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="${total}"><i style="width:${Math.min(100,total?value/total*100:0)}%"></i></div>`}
function empty(title,text,action=""){return `<div class="empty-state"><span class="empty-icon">${icon("leaf",30)}</span><h3>${title}</h3><p>${text}</p>${action}</div>`}
function taskButton(id,label="Open task",cls="btn primary"){return `<button class="${cls}" data-task="${esc(id)}">${label}${icon("arrow",17)}</button>`}
function shell(content){
  const active=nav.find(n=>n[0]===view)||nav[0];
  const today=getToday();
  return `<div class="app-shell">
   <aside class="sidebar" id="sidebar">
    <a class="brand" href="#today"><span class="brand-mark">${icon("code",24)}</span><span>DSA<span class="brand-now">now</span><small>GOOGLE-FIRST · INDIA</small></span></a>
    <div class="sidebar-label">WORKSPACE</div>
    <nav aria-label="Main navigation">${nav.map(([id,ic,label])=>`<a href="#${id}" class="nav-item ${view===id?"active":""}" ${view===id?'aria-current="page"':""}>${icon(ic)}<span>${label}</span>${id==="reviews"&&summary.due.length?`<em>${summary.due.length}</em>`:""}</a>`).join("")}</nav>
    <div class="sidebar-bottom"><div class="path-note"><span class="tiny-label">YOUR APPROACH</span><p>DSA first.<br>Java when you need it.</p><span class="mini-icon">${icon("spark")}</span></div>
    <div class="local-status">${icon("shield",16)}<span id="save-label">${storageError?"Save needs attention":"Saved locally"}</span><span class="status-dot ${storageError?"bad":""}"></span></div>
    <button class="sidebar-backup" data-action="export">${icon("download",16)} Export a backup</button></div>
   </aside>
   <div class="mobile-shade" data-action="close-menu"></div>
   <div class="workspace"><header class="topbar"><div class="breadcrumb"><button class="icon-button mobile-toggle" data-action="menu" aria-label="Open navigation">${icon("menu")}</button><span>Workspace</span>${icon("chevron",13)}<strong>${active[2]}</strong></div>
     <div class="topbar-right"><span class="date-top">${new Intl.DateTimeFormat("en",{weekday:"short",day:"numeric",month:"short",timeZone:state.settings.timezone}).format(new Date())}</span><span class="streak-pill">${icon("flame",16)}${summary.streak?summary.streak+" day streak":"A fresh start"}</span><span class="avatar" title="Your personal workspace">YOU</span></div></header>
   <main id="main" tabindex="-1">${storageError?`<div class="alert error">${esc(storageError)} <button data-action="reload" class="text-button">Reload current progress</button></div>`:""}${state.settings.paused?`<div class="alert">Your plan is paused. Your history is safe. <a href="#settings">Resume in settings</a></div>`:""}${content}
   <footer class="footer"><span>Small steps. Real understanding.</span><span>${icon("shield",13)} Stored in this browser · <a href="#settings">Back up your progress</a></span></footer></main></div>
  </div>`;
}
function title(kicker,heading,sub,action=""){return `<div class="page-heading"><div><span class="eyebrow">${kicker}</span><h1>${heading}</h1><p>${sub}</p></div>${action}</div>`}
function orbitArt(){
  return `<svg class="orbit-art" viewBox="0 0 380 270" fill="none" aria-hidden="true">
  <ellipse cx="194" cy="143" rx="143" ry="78" transform="rotate(-30 194 143)" stroke="#8caa9d" stroke-opacity=".32" stroke-dasharray="5 7"/>
  <ellipse cx="194" cy="143" rx="123" ry="53" transform="rotate(42 194 143)" stroke="#8caa9d" stroke-opacity=".26"/>
  <path d="M70 166 154 101 241 170 312 68" stroke="#d6fa75" stroke-width="2"/>
  <circle cx="70" cy="166" r="10" fill="#d6fa75"/><circle cx="154" cy="101" r="8" fill="#bdd9cd"/>
  <circle cx="241" cy="170" r="10" fill="#d6fa75"/><circle cx="312" cy="68" r="7" fill="#bdd9cd"/>
  <rect x="141" y="120" width="103" height="72" rx="18" transform="rotate(-8 141 120)" fill="#d6fa75"/>
  <path d="m175 136-13 14 9 17m44-37 13 14-9 17m-22-29-5 29" stroke="#20362b" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <g transform="rotate(8 283 207)"><rect x="256" y="187" width="70" height="43" rx="10" fill="#304a40"/><path d="m279 209 7 7 14-16" stroke="#d6fa75" stroke-width="3" stroke-linecap="round"/></g>
  <text x="52" y="98" fill="#9bb2a8" font-family="monospace" font-size="12">O(n)</text>
  <text x="248" y="46" fill="#9bb2a8" font-family="monospace" font-size="12">grow()</text>
  <path d="M331 139v14m-7-7h14M105 226v10m-5-5h10" stroke="#708e80" stroke-width="1.5"/>
  </svg>`;
}
function timerCard(){
  return `<section class="focus-card card"><div class="section-label">${icon("clock",17)} FOCUS MODE</div><div id="timer-display" class="timer-display">${formatTimer()}</div><p>One thing. A little less distraction.</p><div class="timer-presets"><button data-timer-preset="25" class="${timer.total===1500?"selected":""}">25 min</button><button data-timer-preset="55" class="${timer.total===3300?"selected":""}">55 min</button></div><button class="btn dark full" data-action="timer-toggle">${icon(timer.running?"pause":"play",16)}<span id="timer-label">${timer.running?"Pause session":"Start focusing"}</span></button><button class="text-button timer-reset" data-action="timer-reset">Reset timer</button><small>Use “Log attempt” to record study time.</small></section>`;
}
function heatmap(days=35){
  const today=getToday(),cells=Array.from({length:days},(_,i)=>{const day=addDays(today,i-days+1),min=summary.daily[day]||0;return `<span class="heat-cell level-${min===0?0:min<30?1:min<60?2:min<90?3:4}" tabindex="0" aria-label="${day}: ${min} minutes" title="${day}: ${min} minutes"></span>`}).join("");
  return `<div class="heatmap" style="--heat-cols:${days===35?7:14}">${cells}</div><div class="heat-legend"><span>Last ${days} days</span><span>Less <i class="level-0"></i><i class="level-2"></i><i class="level-4"></i> More</span></div>`;
}
function renderToday(){
  const w=currentWeek(),next=summary.next,weekSolved=w.coreProblemIds.filter(id=>summary.reviews[id].everSolved).length;
  const design=latestDesign(state.systemDesignEntries,w.systemDesignId);
  const greeting=new Date().toLocaleTimeString("en",{hour:"numeric",hour12:false,timeZone:state.settings.timezone}).slice(0,2);
  const greet=Number(greeting)<12?"Good morning":Number(greeting)<17?"Good afternoon":"Good evening";
  const pct=Math.round(summary.solved/96*100);
  return `${title("YOUR NEXT CHAPTER",`${greet}. Let's make progress.`,"You don't have to learn everything today. Just take the next useful step.",
    `<button class="btn outline" data-action="export">${icon("download",17)} Backup</button>`)}
    <div class="hero-grid"><section class="hero"><div class="hero-content"><span class="hero-chip"><i></i> WEEK ${String(w.week).padStart(2,"0")} OF 24</span><h2>Build the habit.<br><span>Ship the skill.</span></h2><p>Java DSA + system design.<br>A little practice, a little clearer every day.</p>
    ${state.settings.paused?'<a class="btn lime" href="#settings">Resume your plan</a>':next?taskButton(next.id,summary.reviews[next.id].latest?"Continue practising":"Start today's practice","btn lime"):'<a class="btn lime" href="#practice">Explore extended practice</a>'}</div>${orbitArt()}<span class="hero-caption">UNDERSTAND → BUILD → REVISIT</span></section>${timerCard()}</div>
    <section class="metrics-grid" aria-label="Progress overview">${[
      ["code",`${summary.solved}<small>/96</small>`,"Core tasks solved",`${pct}% of your core path`,"sage"],
      ["repeat",`${summary.retained}`,"Patterns retained","Reproduced on later days","lavender"],
      ["design",`${summary.designReviewed}<small>/24</small>`,"Designs reviewed","Explain the why, not just the boxes","peach"],
      ["clock",duration(summary.totalMinutes),"Time invested",`${summary.todayMinutes} minutes today`,"blue"]
    ].map(([ic,num,label,sub,color])=>`<article class="metric card"><span class="metric-icon ${color}">${icon(ic)}</span><div class="metric-value">${num}</div><h3>${label}</h3><p>${sub}</p></article>`).join("")}</section>
    <div class="section-heading"><div><h2>Your next moves</h2><p>A balanced day, without the overload.</p></div><a href="#roadmap" class="text-link">See roadmap ${icon("arrow",16)}</a></div>
    ${state.settings.paused?'<div class="alert">New-task suggestions are paused. You can still browse your curriculum or revisit the revision queue.</div>':`<div class="moves-grid"><article class="move-card card"><div class="move-top"><span class="icon-tile sage">${icon("code",23)}</span>${badge("55 MIN","neutral")}</div><span class="eyebrow">01 / PRACTISE</span><h3>${next?esc(next.title):"Keep your patterns fresh"}</h3><p>${next?esc(next.id)+" · "+esc(seed.modules.find(m=>m.id===next.moduleId).title):"Your core path is complete. Revisit or explore."}</p>${next?taskButton(next.id,"Open problem","text-link"):'<a href="#practice" class="text-link">Explore practice →</a>'}</article>
    <article class="move-card card"><div class="move-top"><span class="icon-tile peach">${icon("design",23)}</span>${badge("25 MIN","neutral")}</div><span class="eyebrow">02 / DESIGN</span><h3>${esc(w.systemDesign)}</h3><p>${esc(w.designDeliverable)}</p><button class="text-link" data-design-week="${w.week}">${design?"Continue your design":"Open design task"}${icon("arrow",16)}</button></article>
    <article class="move-card card"><div class="move-top"><span class="icon-tile lavender">${icon("repeat",23)}</span>${badge("10 MIN","neutral")}</div><span class="eyebrow">03 / REMEMBER</span><h3>${summary.due.length?summary.due.length+" tasks ready for a revisit":"Make it stick."}</h3><p>${summary.due.length?"A blank file. No solution open. See what stayed with you.":"Your first revision appears after an attempt. Java help is here if you hit a blocker."}</p><a class="text-link" href="#${summary.due.length?"reviews":"java"}">${summary.due.length?"Open revision queue":"Browse targeted Java help"}${icon("arrow",16)}</a></article></div>`}
    <div class="bottom-grid"><section class="card week-card"><div class="section-heading"><div><span class="eyebrow">THIS WEEK'S FOCUS</span><h2>${esc(w.dsa)}</h2></div><span class="fraction">${weekSolved}<small>/4 solved</small></span></div>${progressBar(weekSolved,4)}
    <div class="week-task-list">${w.coreProblemIds.map(id=>{const p=seed.problems.find(p=>p.id===id),r=summary.reviews[id];return `<button data-task="${id}" class="week-task"><span class="task-check ${r.everSolved?"done":""}">${r.everSolved?icon("check",14):""}</span><span>${esc(p.title)}<small>${id}</small></span>${icon("chevron",16)}</button>`}).join("")}</div></section>
    <section class="card activity-card"><span class="eyebrow">SHOWING UP ADDS UP</span><h2>Your consistency garden</h2><p>Every square is time you gave yourself.</p>${heatmap()}<div class="activity-bottom">${icon("leaf",18)} ${summary.streak?`${summary.streak} ${summary.streak===1?"day":"days"} of steady effort.`:"Your first session plants the first square."}</div></section></div>`;
}
function filteredProblems(){
  return seed.problems.filter(p=>{
    const r=summary.reviews[p.id];
    return (filters.track==="all"||p.track===filters.track)&&(filters.module==="all"||p.moduleId===filters.module)&&
      (filters.difficulty==="all"||p.difficulty===filters.difficulty)&&
      (filters.status==="all"||(filters.status==="Retained"?r.retained:r.outcome===filters.status))&&
      (!filters.query||`${p.id} ${p.title} ${p.prompt}`.toLowerCase().includes(filters.query.toLowerCase()));
  });
}
function problemTable(rows){
  if(!rows.length)return empty("No tasks match this view.","Try another topic or clear your filters.",'<button class="btn outline" data-action="reset-filters">Clear filters</button>');
  return `<div class="table-scroll"><table class="practice-table"><thead><tr><th>Problem</th><th>Topic</th><th>Level</th><th>Status</th><th>Next review</th><th><span class="sr-only">Action</span></th></tr></thead><tbody>${rows.map(p=>{const r=summary.reviews[p.id],m=seed.modules.find(m=>m.id===p.moduleId);return `<tr><td><button class="problem-name" data-task="${p.id}">${esc(p.title)}</button><div class="problem-meta">${p.id}<span>·</span>${p.track}</div></td><td><span class="topic-letter">${m.letter}</span>${esc(m.title)}</td><td>${badge(p.difficulty,p.difficulty==="Easy"?"green":p.difficulty==="Hard"?"orange":"violet")}</td><td>${outcomeBadge(r)}</td><td>${r.nextDueDate?`<span class="${r.nextDueDate<=getToday()?"due-date":""}">${dateLabel(r.nextDueDate)}</span>`:"<span class='muted'>Not scheduled</span>"}</td><td><button class="icon-button" data-task="${p.id}" aria-label="Open ${esc(p.title)}">${icon("arrow",18)}</button></td></tr>`}).join("")}</tbody></table></div>`;
}
function renderPractice(){
  const rows=filteredProblems();
  return `${title("A TO Z, ONE PROBLEM AT A TIME","Your practice playground.","156 original practice tasks. Start with the 96 core tasks; explore the rest when you're ready.")}
  <div class="practice-banner"><span class="icon-tile sage">${icon("code")}</span><div><strong>You already started Java. Now use it.</strong><p>Every task includes a targeted refresher. No restart required.</p></div><span class="banner-count">26 <small>modules</small></span></div>
  <section class="card catalog"><div class="catalog-toolbar"><label class="search-field">${icon("search",18)}<input id="problem-search" type="search" placeholder="Search a problem, pattern, or ID…" value="${esc(filters.query)}" aria-label="Search problems"></label>
  <div class="segmented" aria-label="Practice track">${[["Core","Core 96"],["Extended","Extended 60"],["all","All tasks"]].map(([v,l])=>`<button data-track="${v}" class="${filters.track===v?"selected":""}" aria-pressed="${filters.track===v}">${l}</button>`).join("")}</div></div>
  <div class="filter-row"><label>Topic<select data-filter="module"><option value="all">All modules</option>${seed.modules.map(m=>`<option value="${m.id}" ${filters.module===m.id?"selected":""}>${m.letter} · ${esc(m.title)}</option>`).join("")}</select></label><label>Difficulty<select data-filter="difficulty">${["all","Easy","Medium","Hard","Varies"].map(x=>`<option value="${x}" ${filters.difficulty===x?"selected":""}>${x==="all"?"All levels":x}</option>`).join("")}</select></label><label>Progress<select data-filter="status">${["all","Not started","Attempted","Solved with help","Solved independently","Retained"].map(x=>`<option value="${x}" ${filters.status===x?"selected":""}>${x==="all"?"Any status":x}</option>`).join("")}</select></label><span id="result-count" class="result-count">${rows.length} tasks</span><button class="text-button" data-action="reset-filters">Reset</button></div>
  <div id="problem-results">${problemTable(rows)}</div></section>`;
}
function renderReviews(){
  const started=seed.problems.filter(p=>summary.reviews[p.id].latest);
  const upcoming=started.filter(p=>summary.reviews[p.id].nextDueDate>getToday()).sort((a,b)=>summary.reviews[a.id].nextDueDate.localeCompare(summary.reviews[b.id].nextDueDate));
  return `${'<a href="#practice" class="back-sheet">← Back to DSA sheet</a>'+title("TURN PRACTICE INTO MEMORY","Come back. See what stuck.","Solve from a blank file. A successful independent review on a later day builds retention.")}
  <div class="review-explainer card"><div><span class="icon-tile lavender">${icon("repeat",25)}</span><h3>Your revision rhythm</h3><p>Two successful later-day reviews earn “Retained”. A difficult revisit is useful feedback.</p></div><div class="review-steps">${["Initial solve","Review 1","Review 2","Review 3+"].map((l,i)=>`<div><span>${l}</span><strong>+${[1,3,7,21][i]} day${i?"s":""}</strong>${i===2?'<small>Retained</small>':""}</div>`).join("")}</div></div>
  <div class="section-heading"><h2>Ready for a revisit <span class="count-pill">${summary.due.length}</span></h2></div>
  ${summary.due.length?`<section class="card">${problemTable(summary.due)}</section>`:empty("Your revision queue is clear.","After your first attempt, a task will return here on its scheduled review date.",'<a href="#practice" class="btn primary">Find a problem '+icon("arrow",16)+'</a>')}
  ${upcoming.length?`<div class="section-heading"><h2>Coming up</h2><span class="muted">${upcoming.length} scheduled</span></div><section class="card">${problemTable(upcoming)}</section>`:""}`;
}
function renderRoadmap(){
  return `${title("A PLAN THAT MOVES WITH YOU","24 weeks. Your own pace.","Four core tasks, one design output, and room to revisit. Missed days never erase progress.")}
  <div class="roadmap-intro"><div>${icon("code",23)}<strong>Days 1–4</strong><span>Learn + solve</span></div><div>${icon("repeat",23)}<strong>Day 5</strong><span>Revisit older tasks</span></div><div>${icon("design",23)}<strong>Day 6</strong><span>Build a design</span></div><div>${icon("leaf",23)}<strong>Day 7</strong><span>Rest or resume</span></div></div>
  <div class="roadmap-grid">${seed.roadmap.map(w=>{const solved=w.coreProblemIds.filter(id=>summary.reviews[id].everSolved).length;const d=latestDesign(state.systemDesignEntries,w.systemDesignId);return `<article class="roadmap-card card ${w.week===state.settings.activeWeek?"current":""}"><div class="roadmap-top"><span class="week-label">WEEK ${String(w.week).padStart(2,"0")}</span>${w.week===state.settings.activeWeek?badge("You're here","green"):solved===4&&d?.status==="Reviewed"?badge("Complete","green"):""}</div><h3>${esc(w.dsa)}</h3><div class="roadmap-design">${icon("design",15)}${esc(w.systemDesign)}</div>${progressBar(solved,4)}<div class="roadmap-count"><span>${solved}/4 core solved</span><span>${d?.status==="Reviewed"?"Design reviewed":"Design: "+(d?.status||"not started")}</span></div><div class="roadmap-actions"><button class="text-link" data-module="${w.moduleId}">Practise ${icon("arrow",15)}</button><button class="text-button" data-design-week="${w.week}">Design task</button>${w.week!==state.settings.activeWeek?`<button class="text-button" data-set-week="${w.week}" aria-label="Set week ${w.week} as current">Set current</button>`:""}</div></article>`}).join("")}</div>`;
}
function renderDesign(){
  const w=seed.roadmap.find(r=>r.week===designWeek)||currentWeek(),d=latestDesign(state.systemDesignEntries,w.systemDesignId);
  const versions=state.systemDesignEntries.filter(e=>e.systemDesignId===w.systemDesignId).sort((a,b)=>b.occurredAt.localeCompare(a.occurredAt));
  return `${title("SYSTEM DESIGN, MADE APPROACHABLE","Start small. Think clearly.","Understand the fundamentals, sketch a solution, and explain your choices. Work at your own pace.")}
  <div class="design-layout"><aside class="card design-weeks"><h3>Topics to explore</h3>${seed.roadmap.map(r=>`<button data-design-week="${r.week}" class="${w.week===r.week?"selected":""}"><span>${String(r.week).padStart(2,"0")}</span><span>${esc(r.systemDesign)}</span>${latestDesign(state.systemDesignEntries,r.systemDesignId)?.status==="Reviewed"?icon("check",15):""}</button>`).join("")}</aside>
  <section><div class="design-brief"><span class="eyebrow">${w.systemDesignId} / DESIGN NOTEBOOK</span><h2>${esc(w.systemDesign)}</h2><p>${esc(w.designDeliverable)}</p><div class="checkpoint">${icon("check",18)}<span>${esc(w.designCheckpoint)}</span></div></div>
  ${w.week===1?`<div class="request-flow card"><span>${icon("home",22)}Client<small>sends a request</small></span>${icon("arrow")}<span>${icon("code",22)}Server<small>runs your logic</small></span>${icon("arrow")}<span>${icon("book",22)}Database<small>stores the data</small></span></div>`:""}
  <form id="design-form" class="card form-card"><input type="hidden" name="systemDesignId" value="${w.systemDesignId}"><div class="section-heading"><h3>Your design notebook</h3>${badge(d?.status||"Not started",d?.status==="Reviewed"?"green":"neutral")}</div>
  <div class="form-grid">${[
    ["requirements","What does it need to do?","Who uses it, and what matters most?"],
    ["flow","Walk through one request","What happens first, next, and last?"],
    ["data","What data do you need?","Entities, keys, or the important pieces of state."],
    ["tradeoff","One decision and its cost","Why this choice? What do you give up?"],
    ["failure","What could go wrong?","How would you detect it and recover?"],
    ["artifact","Your diagram or design artifact","Paste a diagram link, an ASCII sketch, or a written design."]
  ].map(([key,label,placeholder])=>`<label>${label}<textarea name="${key}" rows="4" placeholder="${placeholder}">${esc(d?.[key]||"")}</textarea></label>`).join("")}</div>
  <div class="form-row"><label>Status<select name="status">${["Learning","Drafted","Reviewed"].map(x=>`<option ${d?.status===x?"selected":""}>${x}</option>`).join("")}</select></label><label>Minutes spent this session<input name="minutes" type="number" min="0" max="1440" value="0" required></label></div>
  <label class="check-label"><input type="checkbox" name="confirmed" ${d?.confirmed?"checked":""}> I can explain the requirements, flow, data, tradeoff and failure case.</label><p class="field-hint">“Reviewed” needs all six notes and your confirmation. You can save a draft anytime.</p>
  <div class="form-error" role="alert"></div><button class="btn primary" type="submit">${icon("check",17)} Save design session</button></form>
  ${versions.length?`<details class="card history-details"><summary>${versions.length} saved session${versions.length===1?"":"s"} · ${duration(versions.reduce((n,e)=>n+e.minutes,0))} invested</summary>${versions.map(e=>`<div class="history-row"><strong>${dateLabel(e.localDate)} · ${esc(e.status)}</strong><span>${e.minutes} min</span><p>${esc(e.artifact||e.requirements||"Draft saved.")}</p></div>`).join("")}</details>`:""}</section></div>`;
}
function javaCard(j){
  const entries=state.javaRevisionEntries.filter(e=>e.javaHelpId===j.id),last=entries.at(-1);
  return `<article class="card java-card"><div class="java-card-head"><span class="java-id">${j.id}</span>${last?badge(last.blockerResolved?"Blocker resolved":"Needs another look",last.blockerResolved?"green":"orange"):badge("On demand","neutral")}</div><h3>${esc(j.trigger)}</h3><p>${esc(j.revise)}</p><pre><code>${esc(j.example)}</code></pre><div class="java-card-bottom"><button class="text-link" data-java="${j.id}">Revise & log ${icon("arrow",16)}</button><a href="${safeUrl(j.url)}" target="_blank" rel="noopener noreferrer" class="icon-button" aria-label="Open Java reference">${icon("external",17)}</a></div></article>`;
}
function renderJava(){
  return `${title("JUST ENOUGH JAVA","Unblock the problem. Keep moving.","Pick the concept you need, spend 10–15 minutes, then apply it to the same DSA task.")}
  <div class="java-note">${icon("java",24)}<p><strong>No Java restart.</strong> These are help cards, not another course to finish.</p></div>
  <div class="java-grid">${seed.javaHelp.map(javaCard).join("")}</div>`;
}
function renderProgress(){
  const stats=[["Core independently solved",summary.solved,96,"Historical first independent solves"],["Currently retained",summary.retained,96,"Latest evidence + two later-day reviews"],["Designs reviewed",summary.designReviewed,24,"Saved artifact + review checklist"]];
  const trackMinutes=[
    ["DSA practice",state.attempts.reduce((n,e)=>n+(e.minutes||0),0),"sage"],
    ["System design",state.systemDesignEntries.reduce((n,e)=>n+(e.minutes||0),0),"peach"],
    ["Java revision",state.javaRevisionEntries.reduce((n,e)=>n+(e.minutes||0),0),"lavender"],
    ["Career preparation",state.careerEntries.reduce((n,e)=>n+(e.minutes||0),0),"sage"]
  ];
  return `${title("EVIDENCE OVER CHECKBOXES","Look at what you're building.","A solve, an explanation, a later revisit. Each tells a different part of the story.")}
  <div class="progress-cards">${stats.map(([l,n,total,desc])=>`<article class="card progress-card"><div class="ring" style="--p:${n/total*100}%"><span>${Math.round(n/total*100)}<small>%</small></span></div><h3>${l}</h3><strong>${n} / ${total}</strong><p>${desc}</p></article>`).join("")}</div>
  <div class="bottom-grid"><section class="card activity-card"><span class="eyebrow">A LITTLE, OFTEN</span><h2>Your last ten weeks</h2>${heatmap(70)}</section><section class="card time-card"><span class="eyebrow">TIME WELL INVESTED</span><h2>${duration(summary.totalMinutes)}</h2>${trackMinutes.map(([label,n,color])=>`<div class="time-row"><span class="dot ${color}"></span><strong>${label}</strong><span>${duration(n)}</span></div>`).join("")}<p class="field-hint">Only logged session time is counted. Preparation and mock sessions are included.</p></section></div>
  <div class="section-heading"><h2>Your pattern library</h2><p>Core progress by module</p></div><section class="card module-progress">${seed.modules.filter(m=>!m.optionalOnly).map(m=>{const tasks=seed.problems.filter(p=>p.moduleId===m.id&&p.track==="Core"),solved=tasks.filter(p=>summary.reviews[p.id].everSolved).length,retained=tasks.filter(p=>summary.reviews[p.id].retained).length;return `<button class="module-progress-row" data-module="${m.id}"><span class="topic-letter">${m.letter}</span><strong>${esc(m.title)}</strong>${progressBar(solved,4)}<span>${solved}/4 solved</span><small>${retained} retained</small>${icon("chevron",16)}</button>`}).join("")}</section>`;
}
function renderHistory(){
  const events=[...state.attempts.map(e=>({...e,type:"DSA",label:seed.problems.find(p=>p.id===e.problemId)?.title,detail:e.outcome,note:e.notes})),
    ...state.systemDesignEntries.map(e=>({...e,type:"Design",label:seed.roadmap.find(w=>w.systemDesignId===e.systemDesignId)?.systemDesign,detail:e.status,note:e.artifact})),
    ...state.javaRevisionEntries.map(e=>({...e,type:"Java",label:seed.javaHelp.find(j=>j.id===e.javaHelpId)?.trigger,detail:e.blockerResolved?"Resolved":"Revisiting",note:e.takeaway})),
    ...state.studyEntries.filter(e=>e.kind==="session").map(e=>({...e,localDate:e.date,type:e.track,label:e.track+" study session",detail:"Logged time",note:e.notes})),
    ...state.careerEntries.map(e=>({...e,type:e.kind==="application"?"Application":e.kind==="mock"?"Mock":"Preparation",label:e.title,detail:e.status,note:e.notes+(e.kind==="application"?"\nNext action: "+e.nextAction:"")}))]
    .sort((a,b)=>b.occurredAt.localeCompare(a.occurredAt));
  return `${'<a href="#practice" class="back-sheet">← Back to DSA sheet</a>'+title("YOUR WORK, KEPT SAFE","Every attempt has a story.","New learning activity lives here. Your previous Java planner remains in its own archive.")}
  <section class="card"><div class="card-heading"><h2>Learning activity</h2><span class="muted">${events.length} saved sessions</span></div>${events.length?`<div class="event-list">${events.slice(0,200).map(e=>`<details class="event"><summary><span class="event-icon ${e.type==="DSA"?"sage":e.type==="Design"?"peach":"lavender"}">${icon(e.type==="DSA"?"code":e.type==="Design"?"design":"java",19)}</span><span><strong>${esc(e.label)}</strong><small>${esc(e.type)} · ${esc(e.detail)} · ${dateLabel(e.localDate)}</small></span><span>${duration(e.minutes||0)}</span>${icon("chevron",15)}</summary><div class="event-body"><p>${esc(e.note||"No notes for this session.")}</p>${e.code?`<pre><code>${esc(e.code)}</code></pre>`:""}</div></details>`).join("")}</div>${events.length>200?'<p class="field-hint padded">Showing the most recent 200 sessions. All records are included in your backup.</p>':""}`:empty("Your next attempt starts this story.","Log a DSA attempt, a design session, or a targeted Java revision.")}</section>
  <div class="section-heading"><div><span class="eyebrow">WHERE YOU STARTED</span><h2>Your Java planner archive</h2></div><button class="btn outline" data-action="import">${icon("upload",16)} Import backup</button></div>
  ${state.legacyImports.map(item=>{const days=Object.entries(item.payload.days),learning=days.reduce((n,[,d])=>n+d.learn.filter(Boolean).length,0),practice=days.reduce((n,[,d])=>n+d.practice.filter(Boolean).length,0),active=days.filter(([,d])=>[...d.learn,...d.practice].some(Boolean));return `<section class="card legacy-card"><div class="legacy-header"><span class="icon-tile blue">${icon("history",25)}</span><div><h3>${esc(item.sourceFileName||"Imported Java planner")}</h3><p>Original history preserved. Topic labels were not present in this backup.</p></div>${badge("Unmapped","neutral")}</div><div class="legacy-metrics"><span><strong>${learning}</strong>Learning checks</span><span><strong>${practice}</strong>Practice checks</span><span><strong>${active.length}</strong>Days with activity</span></div><details><summary>View the original day records</summary><div class="legacy-days">${days.map(([day,d])=>`<div class="legacy-day"><strong>Day ${esc(day)}</strong><span>${d.learn.filter(Boolean).length}/${d.learn.length} learning · ${d.practice.filter(Boolean).length}/${d.practice.length} practice</span>${d.learned?`<p>${esc(d.learned)}</p>`:""}${typeof d.doubts==="string"&&d.doubts.trim()?`<p class="muted">Questions: ${esc(d.doubts)}</p>`:""}</div>`).join("")}</div></details><p class="field-hint">These checks do not automatically complete new DSA tasks. The raw backup is included in every export.</p></section>`}).join("")}`;
}
function renderSettings(){
  const s=state.settings;
  return `${title("MAKE IT WORK FOR YOU","Your pace. Your workspace.","Tune the plan and keep a portable copy of your progress.")}
  <div class="settings-grid"><form id="settings-form" class="card form-card"><h2>Your study preferences</h2><div class="form-grid"><label>Daily study goal (minutes)<input name="minutesPerDay" type="number" min="30" max="360" value="${state.careerProfile.dailyMinutes}" required></label><label>Study days per week<input name="daysPerWeek" type="number" min="1" max="7" value="${state.careerProfile.daysPerWeek}" required></label><input name="activeWeek" type="hidden" value="${s.activeWeek}"><label>Plan start date<input name="startDate" type="date" value="${s.startDate||""}"></label><label class="span-2">Timezone<input name="timezone" value="${esc(s.timezone)}" placeholder="Asia/Kolkata" required><small class="field-hint">An IANA timezone such as Asia/Kolkata or Europe/London.</small></label></div><label class="check-label"><input type="checkbox" name="paused" ${s.paused?"checked":""}> Pause new-task suggestions</label><p class="field-hint">Your history and review dates stay unchanged. Resume whenever you're ready.</p><div class="form-error" role="alert"></div><button class="btn primary" type="submit">Save preferences ${icon("check",16)}</button></form>
  <div><section class="card backup-card"><span class="icon-tile sage">${icon("shield",26)}</span><h2>Your progress belongs to you.</h2><p>Everything saves in this browser profile on this device. Export a backup before clearing browser data or moving to another device.</p><div class="backup-actions"><button class="btn primary full" data-action="export">${icon("download",17)} Export progress JSON</button><button class="btn outline full" data-action="import">${icon("upload",17)} Preview & restore a backup</button></div><div class="backup-last">Last export: ${s.lastBackupAt?esc(new Date(s.lastBackupAt).toLocaleString("en",{timeZone:s.timezone})):"Not yet — make your first backup."}</div></section>
  <section class="card about-card"><h3>Your learning workspace</h3><p>26 modules · 156 practice tasks<br>96 core + 60 extended<br>Daily calendar · Study-time logging</p><div class="small-note">Progress is self-reported. This app does not execute Java or automatically grade solutions.</div><p class="muted">Curriculum ${seed.curriculumVersion}</p></section></div></div>`;
}
const study=createStudy({seed,esc,icon,addDays,dateLabel,state:()=>state,summary:()=>summary,today:getToday,view:()=>view,storageError:()=>storageError,filters:()=>filters,filtered:filteredProblems,commit,toast,refresh:render,discard:()=>{if(dirty&&!confirm("Discard unsaved changes?"))return false;dirty=false;return true;},saved:()=>{dirty=false;render();}});
function render(){
  summary=summarize(seed,state,getToday());
  const renders={practice:study.sheet,design:renderDesign,planner:study.planner,reviews:renderReviews,history:renderHistory,settings:renderSettings};
  if(!renders[view])view="practice";
  $("#app").innerHTML=study.shell(renders[view]());
  document.title=`${nav.find(n=>n[0]===view)?.[2]} · DSA Now`;
}
function formatTimer(){
  const sec=timer.running?Math.max(0,Math.ceil((timer.endsAt-Date.now())/1000)):timer.remaining;
  return `${String(Math.floor(sec/60)).padStart(2,"0")}<span>:</span>${String(sec%60).padStart(2,"0")}`;
}
function timerTick(){
  const el=$("#timer-display");if(el)el.innerHTML=formatTimer();
  if(timer.running&&Date.now()>=timer.endsAt){timer.running=false;timer.remaining=0;toast("Focus block complete. Log your work when you're ready.");if(view==="today")render()}
}
function timerToggle(){
  if(timer.running){timer.remaining=Math.max(0,Math.ceil((timer.endsAt-Date.now())/1000));timer.running=false}
  else{if(timer.remaining===0)timer.remaining=timer.total;timer.endsAt=Date.now()+timer.remaining*1000;timer.running=true}
  if(view==="today")render();
}
function closeTask(force=false){
  if(!force&&dirty&&!confirm("Close without saving these notes?"))return;
  dirty=false;$("#task-dialog").close();selectedProblem=null;javaContext=null;
}
function openTask(id){
  const p=seed.problems.find(p=>p.id===id);if(!p)return;
  if($("#task-dialog").open&&dirty&&!confirm("Discard the unsaved form and open this task?"))return;
  selectedProblem=id;javaContext=null;dirty=false;
  const r=summary.reviews[id],mod=seed.modules.find(m=>m.id===p.moduleId),j=seed.javaHelp.find(j=>j.id===p.javaHelpId);
  const prereq=mod.prerequisiteIds.map(id=>seed.modules.find(m=>m.id===id)).filter(Boolean);
  $("#task-dialog").innerHTML=`<div class="dialog-header"><div><span class="eyebrow">${p.id} / ${p.track.toUpperCase()} PRACTICE</span><h2 id="dialog-title">${esc(p.title)}</h2></div><button class="icon-button" data-action="close-dialog" aria-label="Close task">${icon("close",24)}</button></div>
  <div class="dialog-body"><div class="task-pills">${badge(mod.title,"neutral")}${badge(p.difficulty,"violet")}${outcomeBadge(r)}</div>
  <div class="task-prompt">${esc(p.prompt)}</div><div class="example-box"><span class="eyebrow">TRY THIS CHECK</span><code>${esc(p.example)}</code></div>
  <details class="target-details"><summary>Complexity target & prerequisites</summary><p><strong>Time:</strong> ${esc(p.targetTime)}<br><strong>Extra space:</strong> ${esc(p.extraSpace)}</p><p><strong>Before this module:</strong> ${prereq.length?prereq.map(m=>esc(m.title)).join(", "):"Ready to start."}</p><p class="field-hint">State your assumptions. Test empty inputs where allowed, boundaries, duplicates, and overflow. Targets are guidance, not an automatic grade.</p></details>
  <div class="inline-java">${icon("java",20)}<div><strong>Java getting in the way?</strong><span>${esc(j.revise)}</span></div><button class="text-button" data-java="${j.id}" data-linked-task="${p.id}">Open help</button></div>
  <form id="attempt-form"><input type="hidden" name="problemId" value="${p.id}"><div class="form-section-title"><h3>Log this attempt</h3><span>${dateLabel(getToday())} · Self-reported</span></div>
  <div class="form-grid"><label>How did it go?<select name="outcome" required><option>Attempted</option><option>Solved with help</option><option>Solved independently</option></select></label><label>Help used<select name="help"><option>None</option><option>Hint</option><option>Solution / AI</option></select></label><label>Time spent (minutes)<input type="number" name="minutes" min="0" max="1440" value="25" required></label><label>Confidence<select name="confidence"><option value="">Not rated</option>${[1,2,3,4,5].map((x,i)=>`<option value="${x}">${x} — ${["Still confused","Need guidance","Getting there","Mostly clear","Can teach it"][i]}</option>`).join("")}</select></label></div>
  <div class="attempt-checks"><label class="check-label"><input type="checkbox" name="testsPassed"> I checked the example and edge cases.</label><label class="check-label"><input type="checkbox" name="canExplain"> I can explain the approach, time and space.</label></div>
  <label>What did you learn or get stuck on?<textarea name="notes" rows="3" placeholder="The mistake, the insight, or what to try next…"></textarea></label>
  <details class="code-details"><summary>Add your Java solution or a link</summary><label>Java code<textarea name="code" rows="7" class="code-input" spellcheck="false" placeholder="Paste your solution here (stored as text, not executed)."></textarea></label><label>Solution URL (optional)<input name="solutionUrl" type="url" placeholder="https://…"></label></details>
  <div class="form-error" role="alert"></div><div class="dialog-form-footer"><span>${icon("shield",14)} Saves to this browser</span><button type="submit" class="btn primary">Save attempt ${icon("check",17)}</button></div></form>
  ${r.events.length?`<details class="attempt-history"><summary>${r.events.length} earlier attempt${r.events.length===1?"":"s"}${r.nextDueDate?" · Next review "+dateLabel(r.nextDueDate):""}</summary>${[...r.events].reverse().map(e=>`<article><div><strong>${esc(e.outcome)}</strong><span>${dateLabel(e.localDate)} · ${e.minutes}m</span></div><p>${esc(e.notes||"No notes.")}</p>${e.code?`<details><summary>Saved code</summary><pre><code>${esc(e.code)}</code></pre></details>`:""}${safeUrl(e.solutionUrl)?`<a class="text-link" href="${safeUrl(e.solutionUrl)}" target="_blank" rel="noopener noreferrer">Solution link ${icon("external",14)}</a>`:""}</article>`).join("")}</details>`:""}</div>`;
  if(!$("#task-dialog").open)$("#task-dialog").showModal();
}
function openJava(id,linked=null){
  const j=seed.javaHelp.find(j=>j.id===id);if(!j)return;
  if(dirty&&!confirm("Open Java help without saving the current form?"))return;
  dirty=false;javaContext={id,linked};selectedProblem=null;
  $("#task-dialog").innerHTML=`<div class="dialog-header"><div><span class="eyebrow">${j.id} / JAVA ON DEMAND</span><h2 id="dialog-title">A quick refresher.</h2></div><button class="icon-button" data-action="close-dialog" aria-label="Close Java help">${icon("close",24)}</button></div><div class="dialog-body"><span class="icon-tile peach">${icon("java",28)}</span><h3>${esc(j.trigger)}</h3><p class="task-prompt">${esc(j.revise)}</p><pre class="java-example"><code>${esc(j.example)}</code></pre><a class="btn outline" href="${safeUrl(j.url)}" target="_blank" rel="noopener noreferrer">Open Java reference ${icon("external",16)}</a>
  <form id="java-form"><input type="hidden" name="javaHelpId" value="${j.id}"><input type="hidden" name="problemId" value="${esc(linked||"")}"><div class="form-section-title"><h3>What unblocked you?</h3></div><label>Minutes spent<input name="minutes" type="number" min="0" max="1440" value="10" required></label><label>Takeaway<textarea name="takeaway" rows="4" placeholder="Write the one thing you'll apply to your problem." required></textarea></label><label class="check-label"><input type="checkbox" name="blockerResolved"> I can continue with the problem.</label><div class="form-error" role="alert"></div><button type="submit" class="btn primary">${linked?"Save & return to problem":"Save revision"} ${icon("arrow",16)}</button></form></div>`;
  if(!$("#task-dialog").open)$("#task-dialog").showModal();
}
function eventBase(minutes){const date=new Date();return {id:crypto.randomUUID(),occurredAt:date.toISOString(),localDate:localDate(date,state.settings.timezone),timezone:state.settings.timezone,minutes:Number(minutes)}}
async function submitAttempt(form){
  const f=new FormData(form),outcome=f.get("outcome"),help=f.get("help");
  if(outcome==="Solved independently"&&(help!=="None"||!f.has("testsPassed")||!f.has("canExplain")))throw new Error("For an independent solve, choose no help and confirm your tests and explanation. Otherwise record an attempted or assisted solve.");
  if(f.get("solutionUrl")&&!safeUrl(f.get("solutionUrl")))throw new Error("Use an http or https solution link.");
  const e={...eventBase(f.get("minutes")),problemId:f.get("problemId"),outcome,help,
    testsPassed:f.has("testsPassed"),canExplain:f.has("canExplain"),
    confidence:f.get("confidence")?Number(f.get("confidence")):null,notes:f.get("notes").trim(),
    code:f.get("code").trim(),solutionUrl:f.get("solutionUrl").trim()};
  await commit(s=>s.attempts.push(e));closeTask(true);render();
  toast(qualified(e)?"Independent solve saved. Your next review is scheduled.":"Attempt saved. Every honest attempt is progress.");
}
async function submitJava(form){
  const f=new FormData(form),linked=f.get("problemId")||null;
  const e={...eventBase(f.get("minutes")),javaHelpId:f.get("javaHelpId"),problemId:linked,
    takeaway:f.get("takeaway").trim(),blockerResolved:f.has("blockerResolved")};
  await commit(s=>s.javaRevisionEntries.push(e));closeTask(true);render();toast("Java revision saved. Back to building.");
  if(linked)openTask(linked);
}
async function submitDesign(form){
  const f=new FormData(form),e={...eventBase(f.get("minutes")),systemDesignId:f.get("systemDesignId"),status:f.get("status"),confirmed:f.has("confirmed")};
  for(const key of ["requirements","flow","data","tradeoff","failure","artifact"])e[key]=f.get(key).trim();
  if(e.status==="Reviewed"&&(!e.confirmed||["requirements","flow","data","tradeoff","failure","artifact"].some(k=>!e[k])))throw new Error("To mark Reviewed, fill in all six design notes and confirm the explanation checklist. You can save as Drafted now.");
  await commit(s=>s.systemDesignEntries.push(e));dirty=false;render();toast(e.status==="Reviewed"?"Design reviewed. You can explain the decisions behind it.":"Design session saved.");
}
async function submitSettings(form){
  const f=new FormData(form),settings=validateSettings({...state.settings,minutesPerDay:Number(f.get("minutesPerDay")),
    daysPerWeek:Number(f.get("daysPerWeek")),activeWeek:Number(f.get("activeWeek")),
    timezone:f.get("timezone").trim(),startDate:f.get("startDate")||null,paused:f.has("paused")});
  await commit(s=>{s.settings=settings;s.careerProfile.dailyMinutes=settings.minutesPerDay;s.careerProfile.daysPerWeek=settings.daysPerWeek});dirty=false;render();toast("Your learning rhythm is updated.");
}
async function exportProgress(){
  const payload=exportBackup(seed,state),blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const a=document.createElement("a"),url=URL.createObjectURL(blob);a.href=url;a.download=`dsa-now-backup-${getToday()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
  await commit(s=>{s.settings.lastBackupAt=new Date().toISOString()});if(!dirty)render();toast("Backup download started. Keep it somewhere safe.");
}
async function previewImport(file){
  if(!file)return;if(file.size>10*1024*1024)throw new Error("Use a JSON file smaller than 10 MB.");
  const text=await file.text();let raw;try{raw=JSON.parse(text)}catch{throw new Error("This file is not valid JSON. Nothing was changed.")}
  let body;
  if(raw.kind==="progress-backup"){
    const backup=validateBackup(raw,seed),preview=mergeBackup(state,backup,{conflict:"keep"});
    importCandidate={kind:"progress",backup};
    body=`<div class="import-stats"><span><strong>${preview.added}</strong>New records</span><span><strong>${preview.duplicates}</strong>Duplicates</span><span><strong>${preview.conflicts}</strong>Conflicts</span></div><p>Identical events are deduplicated. Existing progress stays unless you explicitly choose the imported copy for a conflict.</p>
    ${preview.conflicts?`<label>For conflicting event IDs<select id="conflict-choice"><option value="keep">Keep records already in this browser</option><option value="import">Use records from the imported file</option></select></label>`:""}
    <label class="check-label"><input type="checkbox" id="restore-settings"> Also restore learning preferences from this backup</label>`;
  }else{
    validateLegacy(raw);const hash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(text)))).map(b=>b.toString(16).padStart(2,"0")).join("");
    const duplicate=state.legacyImports.some(e=>e.sha256===hash),days=Object.values(raw.days);
    importCandidate={kind:"legacy",entry:{id:"legacy-"+hash,sha256:hash,sourceFileName:file.name,
      sourceSavedAt:raw.savedAt||null,importedAt:new Date().toISOString(),payload:raw,mappingStatus:"unmapped"},duplicate};
    body=`<div class="import-stats"><span><strong>${days.reduce((n,d)=>n+d.learn.filter(Boolean).length,0)}</strong>Learning checks</span><span><strong>${days.reduce((n,d)=>n+d.practice.filter(Boolean).length,0)}</strong>Practice checks</span></div><p>${duplicate?"This exact backup is already in your archive. Re-importing it will not add records.":"Your original planner will be added to Legacy history. No new DSA tasks will be marked solved."}</p>`;
  }
  $("#import-dialog").innerHTML=`<div class="dialog-header"><div><span class="eyebrow">NOTHING CHANGES UNTIL YOU CONFIRM</span><h2 id="import-title">Preview your import.</h2></div><button class="icon-button" data-action="close-import" aria-label="Close import preview">${icon("close",24)}</button></div><div class="dialog-body"><p class="file-name">${esc(file.name)}</p>${body}<div class="form-error" role="alert"></div><button class="btn primary" data-action="confirm-import">Import safely ${icon("check",17)}</button></div>`;
  $("#import-dialog").showModal();
}
async function confirmImport(){
  if(!importCandidate)return;
  if(importCandidate.kind==="progress"){
    const {state:next,added,conflicts}=mergeBackup(state,importCandidate.backup,{conflict:$("#conflict-choice")?.value||"keep",importSettings:!!$("#restore-settings")?.checked});
    await commit(s=>Object.assign(s,next));toast(`Import complete. ${added} new records; ${conflicts} conflict choices applied.`);
  }else{
    const c=importCandidate;if(!c.duplicate)await commit(s=>s.legacyImports.push(c.entry));
    toast(c.duplicate?"Already archived. No duplicate was added.":"Your Java planner history is preserved.");
  }
  $("#import-dialog").close();importCandidate=null;dirty=false;render();
}
function navigate(next){
  if(dirty&&!confirm("Leave this page without saving your form?"))return false;
  dirty=false;view=next;location.hash=next;document.body.classList.remove("menu-open");render();window.scrollTo({top:0});return true;
}
document.addEventListener("click",async e=>{
  const el=e.target.closest("button,a");if(!el)return;
  try{
    if(await study.click(el))return;
    if(el.matches('a[href^="#"]')){e.preventDefault();navigate(el.getAttribute("href").slice(1));return}
    if(el.dataset.task){openTask(el.dataset.task);return}
    if(el.dataset.java){openJava(el.dataset.java,el.dataset.linkedTask||null);return}
    if(el.dataset.designWeek){const w=Number(el.dataset.designWeek);if(view==="design"&&dirty&&!confirm("Switch weeks without saving this design?"))return;dirty=false;designWeek=w;navigate("design");return}
    if(el.dataset.module){filters.module=el.dataset.module;filters.track="all";filters.query="";navigate("practice");return}
    if(el.dataset.setWeek){await commit(s=>{s.settings.activeWeek=Number(el.dataset.setWeek)});render();toast(`Week ${el.dataset.setWeek} is your current focus.`);return}
    if(el.dataset.track){filters.track=el.dataset.track;render();return}
    if(el.dataset.timerPreset){timer={remaining:Number(el.dataset.timerPreset)*60,total:Number(el.dataset.timerPreset)*60,running:false,endsAt:null};render();return}
    const action=el.dataset.action;
    if(action==="menu")document.body.classList.toggle("menu-open");
    else if(action==="close-menu")document.body.classList.remove("menu-open");
    else if(action==="close-dialog")closeTask();
    else if(action==="close-import"){$("#import-dialog").close();importCandidate=null}
    else if(action==="timer-toggle")timerToggle();
    else if(action==="timer-reset"){timer.remaining=timer.total;timer.running=false;render()}
    else if(action==="reset-filters"){filters={query:"",module:"all",track:"all",difficulty:"all",status:"all"};render()}
    else if(action==="export")await exportProgress();
    else if(action==="import"){if(dirty&&!confirm("Importing can replace this page. Continue without saving your current form?"))return;$("#backup-file").value="";$("#backup-file").click()}
    else if(action==="confirm-import")await confirmImport();
    else if(action==="retry")location.reload();
    else if(action==="reload"){if(dirty&&!confirm("Reload and discard unsaved edits?"))return;state=await readState(db);dirty=false;storageError="";render()}
  }catch(err){toast(err.message,"error");const area=$("#import-dialog[open] .form-error");if(area)area.textContent=err.message}
});
document.addEventListener("click",e=>{if(e.target.matches(".mobile-shade"))document.body.classList.remove("menu-open")});
document.addEventListener("input",e=>{
  if(e.target.id==="problem-search"){
    filters.query=e.target.value;const rows=filteredProblems();$("#problem-results").innerHTML=study.groups(rows);$("#result-count").textContent=`${rows.length} problems`;
  }else if(e.target.closest("form"))dirty=true;
});
document.addEventListener("change",e=>{
  if(e.target.dataset.filter){filters[e.target.dataset.filter]=e.target.value;render()}
  else if(e.target.closest("form"))dirty=true;
});
document.addEventListener("submit",async e=>{
  if(!["attempt-form","java-form","design-form","settings-form","study-plan-form","study-session-form"].includes(e.target.id))return;
  e.preventDefault();const form=e.target,button=form.querySelector('[type="submit"]'),error=form.querySelector(".form-error");error.textContent="";button.disabled=true;
  try{if(form.id.startsWith("study-"))await study.submit(form);else await {"attempt-form":submitAttempt,"java-form":submitJava,"design-form":submitDesign,"settings-form":submitSettings}[form.id](form)}
  catch(err){error.textContent=err.message;error.scrollIntoView({block:"nearest"})}
  finally{button.disabled=false}
});
$("#backup-file").addEventListener("change",async e=>{try{await previewImport(e.target.files[0])}catch(err){toast(err.message,"error")}});
$("#task-dialog").addEventListener("cancel",e=>{e.preventDefault();closeTask()});
$("#import-dialog").addEventListener("cancel",()=>{importCandidate=null});
window.addEventListener("beforeunload",e=>{if(dirty){e.preventDefault();e.returnValue=""}});
window.addEventListener("hashchange",()=>{const next=location.hash.slice(1)||"practice";if(next!==view)navigate(next);document.body.classList.remove("menu-open")});
try{
  db=await openStore();state=await readState(db);
  if(!state)state=await writeState(db,initialState(seed),0);
  if(!state.careerProfile||!state.careerEntries){state=await writeState(db,normalizeCareer(state),state.revision);}
  if(!state.studyEntries)state=await writeState(db,normalizeStudy(state),state.revision);
  const defaults=prefilledPlans(state,seed,getToday());
  if(defaults.length)state=await writeState(db,{...state,studyEntries:[...state.studyEntries,...defaults]},state.revision);
  designWeek=state.settings.activeWeek;
  if("BroadcastChannel" in window){channel=new BroadcastChannel("dsa-now-updates");channel.onmessage=e=>{if(e.data.revision!==state.revision){storageError="Progress changed in another tab. Reload before making more changes.";setSaveLabel("Another tab has updates");toast(storageError,"error")}}}
  render();timerInterval=setInterval(timerTick,500);
}catch(err){
  $("#app").innerHTML=`<div class="boot"><div class="brand-mark">${icon("shield",25)}</div><h1>Your workspace needs storage access.</h1><p>${esc(err.message)}</p><p>Open this app using Start-DSA.cmd in a regular browser profile, then reload. Private browsing or disabled storage may block saving.</p><button class="btn primary" data-action="retry">Try again</button></div>`;
}
