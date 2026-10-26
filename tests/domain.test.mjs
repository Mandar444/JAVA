import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import {reviewState,initialState,summarize,exportBackup,validateBackup,validateLegacy,mergeBackup,addDays,localDate,safeUrl} from "../dist/domain.mjs";
const context={window:{}};vm.runInNewContext(fs.readFileSync(new URL("../dist/curriculum.js",import.meta.url),"utf8"),context);
const seed=JSON.parse(JSON.stringify(context.window.CURRICULUM));
function attempt(day,extra={}) {return {id:"attempt-"+day,problemId:"DSA-A01",occurredAt:day+"T10:00:00.000Z",localDate:day,timezone:"Asia/Kolkata",minutes:25,outcome:"Solved independently",help:"None",testsPassed:true,canExplain:true,confidence:4,notes:"",code:"",solutionUrl:"",...extra}}
test("seed is complete and starts without personal progress",()=>{
 const s=initialState(seed),summary=summarize(seed,s,"2026-10-20");
 assert.equal(seed.problems.length,156);assert.equal(summary.core.length,96);
 assert.equal(summary.solved,0);assert.equal(s.attempts.length,0);
 assert.equal(s.legacyImports.length,0);assert.equal(seed.legacyImport,null);
});
test("independent day 0,1,4 leads to review day 1,4,11",()=>{
 const a=attempt("2026-10-20"),b=attempt("2026-10-21"),c=attempt("2026-10-24");
 assert.equal(reviewState([a],a.problemId).nextDueDate,"2026-10-21");
 assert.equal(reviewState([a,b],a.problemId).nextDueDate,"2026-10-24");
 const r=reviewState([a,b,c],a.problemId);assert.equal(r.nextDueDate,"2026-10-31");assert.equal(r.retained,true);assert.equal(r.streak,2);
});
test("same local day cannot advance retention twice",()=>{
 const a=attempt("2026-10-20"),b=attempt("2026-10-20",{id:"second",occurredAt:"2026-10-20T11:00:00.000Z"});
 assert.equal(reviewState([a,b],a.problemId).streak,0);
 const c=attempt("2026-10-21"),d=attempt("2026-10-21",{id:"fourth",occurredAt:"2026-10-21T12:00:00.000Z"});
 assert.equal(reviewState([a,b,c,d],a.problemId).streak,1);
});
test("assisted or failed attempt resets current retention but preserves historical solve",()=>{
 const events=[attempt("2026-10-20"),attempt("2026-10-21"),attempt("2026-10-24"),
 attempt("2026-10-31",{outcome:"Solved with help",help:"Hint"})];
 const r=reviewState(events,"DSA-A01");
 assert.equal(r.retained,false);assert.equal(r.streak,0);assert.equal(r.everSolved,true);assert.equal(r.nextDueDate,"2026-11-01");
});
test("self-reported independent without checks is not a qualifying solve",()=>{
 assert.equal(reviewState([attempt("2026-10-20",{testsPassed:false})],"DSA-A01").everSolved,false);
 assert.equal(reviewState([attempt("2026-10-20",{help:"Hint"})],"DSA-A01").everSolved,false);
});
test("core denominator, extended work, and session minutes remain separate",()=>{
 const s=initialState(seed);s.attempts.push(attempt("2026-10-20",{problemId:"DSA-A05"}));
 const result=summarize(seed,s,"2026-10-20");assert.equal(result.solved,0);assert.equal(result.core.length,96);assert.equal(result.totalMinutes,25);
});
test("backup validates, merges and deduplicates without replacing history",()=>{
 const s=initialState(seed);s.attempts.push(attempt("2026-10-20"));
 const backup=validateBackup(JSON.parse(JSON.stringify(exportBackup(seed,s))),seed);
 const empty=initialState(seed);const merged=mergeBackup(empty,backup);
 assert.equal(merged.state.attempts.length,1);assert.equal(mergeBackup(merged.state,backup).added,0);
 const changed=structuredClone(backup);changed.attempts[0].notes="changed";
 assert.throws(()=>mergeBackup(merged.state,changed),/conflicting/);
 assert.equal(mergeBackup(merged.state,changed,{conflict:"keep"}).state.attempts[0].notes,"");
 assert.equal(mergeBackup(merged.state,changed,{conflict:"import"}).state.attempts[0].notes,"changed");
});
test("malformed and incompatible backups fail before mutation",()=>{
 const s=initialState(seed),raw=exportBackup(seed,s),before=JSON.stringify(s);
 assert.throws(()=>validateBackup({...raw,schemaVersion:99},seed),/Unsupported/);
 assert.throws(()=>validateBackup({...raw,curriculumVersion:"other"},seed),/different/);
 const bad=structuredClone(raw);bad.attempts=[attempt("2026-10-20",{problemId:"unknown"})];
 assert.throws(()=>validateBackup(bad,seed),/Unknown/);
 assert.equal(JSON.stringify(s),before);
 assert.throws(()=>validateLegacy({version:1,days:{1:{learn:["true"],practice:[]}}}),/Invalid/);
});
test("timezone and date boundaries and unsafe links",()=>{
 assert.equal(localDate(new Date("2026-10-20T20:00:00Z"),"Asia/Kolkata"),"2026-10-21");
 assert.equal(addDays("2026-12-31",1),"2027-01-01");
 assert.equal(safeUrl("javascript:alert(1)"),null);assert.equal(safeUrl("https://dev.java/learn/"),"https://dev.java/learn/");
});
import {normalizeCareer,validateCareerEntries,latestCareer} from '../dist/career-domain.mjs';
import {makeWeeks,prepTasks} from '../dist/career-data.mjs';
test('career migration preserves prior attempts and Java import',()=>{const old=initialState(seed);old.legacyImports.push({id:'legacy-fixture',sha256:'fixture',payload:{version:1,days:{'2':{learn:[true],practice:[false],learned:'Synthetic test note'}}}});old.attempts.push(attempt('2026-10-20'));const n=normalizeCareer(old);assert.deepEqual(n.attempts,old.attempts);assert.deepEqual(n.legacyImports,old.legacyImports);assert.equal(n.careerProfile.dailyMinutes,120);assert.deepEqual(normalizeCareer(n),n);});
const careerEvent=(extra={})=>({id:'c1',itemId:'CS01',kind:'task',occurredAt:'2026-10-26T08:00:00.000Z',localDate:'2026-10-26',minutes:30,notes:'Explained collection costs with examples.',title:'Collections',status:'Done',...extra});
test('new preparation records survive backup and idempotent merge',()=>{const s=normalizeCareer(initialState(seed));s.careerEntries=[careerEvent()];s.careerProfile.week=3;const b=validateBackup(exportBackup(seed,s),seed);const m=mergeBackup(normalizeCareer(initialState(seed)),b,{importSettings:true});assert.equal(m.state.careerEntries.length,1);assert.equal(m.state.careerProfile.week,3);assert.equal(mergeBackup(m.state,b).added,0);assert.equal(summarize(seed,s,'2026-10-26').todayMinutes,30);assert.throws(()=>mergeBackup(s,{...b,careerEntries:[careerEvent({notes:'conflicting'})]}),/conflicting/);});
test('old backup restores without erasing newer career profile or records',()=>{const s=normalizeCareer(initialState(seed));s.careerProfile.week=5;s.careerEntries=[careerEvent()];const b=exportBackup(seed,initialState(seed));b.schemaVersion=1;delete b.careerEntries;delete b.careerProfile;const m=mergeBackup(s,validateBackup(b,seed),{importSettings:true}).state;assert.equal(m.careerProfile.week,5);assert.equal(m.careerEntries.length,1);});
test('career validation rejects missing evidence, bad rubric and unsafe URLs',()=>{assert.throws(()=>validateCareerEntries([careerEvent({notes:''})]));assert.throws(()=>validateCareerEntries([careerEvent({kind:'mock',status:'Coding',scores:[4,4,4,4,5]})]));assert.throws(()=>validateCareerEntries([careerEvent({kind:'application',status:'Saved',company:'Demo',location:'India',url:'javascript:alert(1)',deadline:'',nextAction:''})]));assert.equal(latestCareer([careerEvent(),careerEvent({id:'c2',occurredAt:'2026-10-27T08:00:00Z',status:'Practising'})],'task','CS01').status,'Practising');});
test('22 week plan covers every core task exactly once and valid supporting milestones',()=>{const weeks=makeWeeks(seed),ids=weeks.flatMap(w=>w.ids);assert.equal(weeks.length,22);assert.equal(ids.length,96);assert.equal(new Set(ids).size,96);assert.deepEqual(new Set(ids),new Set(seed.problems.filter(p=>p.track==='Core').map(p=>p.id)));assert.ok(weeks.flatMap(w=>w.parallel).every(id=>prepTasks.some(t=>t.id===id)));assert.equal(addDays('2026-10-26',22*7-1),'2027-03-28');});
