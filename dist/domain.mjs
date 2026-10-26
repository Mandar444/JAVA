import {normalizeStudy,validateStudyEntries} from "./study-domain.mjs";
import {normalizeCareer,validateCareerEntries,validateCareerProfile} from './career-domain.mjs';
export const OUTCOMES = ["Attempted", "Solved with help", "Solved independently"];
export const DESIGN_STATUSES = ["Learning", "Drafted", "Reviewed"];
export function localDate(date = new Date(), timezone = "Asia/Kolkata") {
  const parts = new Intl.DateTimeFormat("en-CA", {timeZone:timezone,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(date);
  const value = type => parts.find(p=>p.type===type).value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}
export function addDays(date, count) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate()+count);
  return d.toISOString().slice(0,10);
}
export function validDate(value) {
  return typeof value==="string" && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value+"T12:00:00Z")) &&
    new Date(value+"T12:00:00Z").toISOString().slice(0,10)===value;
}
export function qualified(a) {
  return a.outcome==="Solved independently" && a.help==="None" && a.testsPassed===true && a.canExplain===true;
}
export function reviewState(attempts, problemId) {
  const events=attempts.filter(a=>a.problemId===problemId)
    .sort((a,b)=>a.occurredAt.localeCompare(b.occurredAt)||a.id.localeCompare(b.id));
  let streak=0, baselineDate=null,lastSuccessDate=null,nextDueDate=null,retained=false;
  for(const a of events) {
    if(qualified(a)) {
      if(!baselineDate) { baselineDate=a.localDate; lastSuccessDate=a.localDate; streak=0; }
      else if(a.localDate>lastSuccessDate) { streak++; lastSuccessDate=a.localDate; }
      nextDueDate=addDays(a.localDate, [1,3,7,21][Math.min(streak,3)]);
      retained=streak>=2;
    } else {
      streak=0; baselineDate=null; lastSuccessDate=null;
      retained=false; nextDueDate=addDays(a.localDate,1);
    }
  }
  const latest=events.at(-1)||null;
  return {events,latest,streak,baselineDate,nextDueDate,retained,everSolved:events.some(qualified),
    outcome:latest ? (qualified(latest)?"Solved independently":latest.outcome==="Attempted"?"Attempted":"Solved with help") : "Not started"};
}
export function latestDesign(entries, id) {
  return entries.filter(e=>e.systemDesignId===id).sort((a,b)=>a.occurredAt.localeCompare(b.occurredAt)||a.id.localeCompare(b.id)).at(-1)||null;
}
export function summarize(seed,state,today=localDate(new Date(),state.settings.timezone)) {
  const reviews=Object.fromEntries(seed.problems.map(p=>[p.id,reviewState(state.attempts,p.id)]));
  const core=seed.problems.filter(p=>p.track==="Core");
  const due=seed.problems.filter(p=>reviews[p.id].nextDueDate && reviews[p.id].nextDueDate<=today)
    .sort((a,b)=>reviews[a.id].nextDueDate.localeCompare(reviews[b.id].nextDueDate)||a.id.localeCompare(b.id));
  const allEvents=[...state.attempts,...state.systemDesignEntries,...state.javaRevisionEntries,...(state.careerEntries||[]),...(state.studyEntries||[]).filter(e=>e.kind==="session").map(e=>({...e,localDate:e.date}))];
  const daily={};
  for(const e of allEvents) daily[e.localDate]=(daily[e.localDate]||0)+(e.minutes||0);
  let streak=0, cursor=daily[today]>0?today:addDays(today,-1);
  while(daily[cursor]>0) { streak++;cursor=addDays(cursor,-1); }
  const weekIds=seed.roadmap.find(w=>w.week===state.settings.activeWeek)?.coreProblemIds||[];
  const next=weekIds.map(id=>seed.problems.find(p=>p.id===id)).find(p=>!reviews[p.id].everSolved) ||
    core.find(p=>!reviews[p.id].everSolved) || null;
  return {reviews,core,due,next,daily,streak,
    solved:core.filter(p=>reviews[p.id].everSolved).length,
    retained:core.filter(p=>reviews[p.id].retained).length,
    attempted:seed.problems.filter(p=>reviews[p.id].latest).length,
    designReviewed:seed.roadmap.filter(w=>latestDesign(state.systemDesignEntries,w.systemDesignId)?.status==="Reviewed").length,
    totalMinutes:allEvents.reduce((n,e)=>n+(e.minutes||0),0),
    todayMinutes:daily[today]||0};
}
export function initialState(seed) {
  return {revision:0,studyEntries:[],settings:{timezone:"Asia/Kolkata",minutesPerDay:90,daysPerWeek:6,startDate:localDate(),
    activeWeek:1,paused:false,lastBackupAt:null},attempts:[],systemDesignEntries:[],javaRevisionEntries:[],
    legacyImports:seed.legacyImport?[{id:"legacy-"+seed.legacyImport.sha256,sha256:seed.legacyImport.sha256,
      sourceFileName:seed.legacyImport.sourceFileName,sourceSavedAt:seed.legacyImport.sourceSavedAt,
      importedAt:new Date().toISOString(),payload:seed.legacyImport.payload,mappingStatus:"unmapped"}]:[]};
}
export function exportBackup(seed,state) {
  return {kind:"progress-backup",schemaVersion:3,curriculumVersion:seed.curriculumVersion,
    exportedAt:new Date().toISOString(),settings:state.settings,attempts:state.attempts,
    systemDesignEntries:state.systemDesignEntries,javaRevisionEntries:state.javaRevisionEntries,legacyImports:state.legacyImports,careerEntries:state.careerEntries||[],careerProfile:normalizeCareer(state).careerProfile,studyEntries:state.studyEntries||[]};
}
function fail(message){throw new Error(message)}
function string(v,label,max=100000){if(typeof v!=="string"||v.length>max)fail(`${label} must be text (max ${max} characters).`)}
function stamp(v,label){string(v,label,60);if(!/^\d{4}-\d{2}-\d{2}T/.test(v)||Number.isNaN(Date.parse(v)))fail(`${label} is not a valid timestamp.`)}
function finiteNumber(v,label,min,max){if(typeof v!=="number"||!Number.isFinite(v)||v<min||v>max)fail(`${label} must be between ${min} and ${max}.`)}
function commonEvent(e, ids, key, kind) {
  if(!e||typeof e!=="object"||Array.isArray(e))fail(`Invalid ${kind} event.`);
  string(e.id,`${kind} ID`,150);if(!e.id)fail("Event ID is empty.");
  if(!ids.has(e[key]))fail(`Unknown ${key}: ${e[key]}`);
  stamp(e.occurredAt,"Event time");
  if(!validDate(e.localDate))fail("Invalid event local date.");
  if(e.minutes!==null)finiteNumber(e.minutes,"Minutes",0,1440);
}
export function validateSettings(s) {
  if(!s||typeof s!=="object")fail("Missing settings.");
  string(s.timezone,"Timezone",100);
  try{new Intl.DateTimeFormat("en",{timeZone:s.timezone})}catch{fail("Unknown timezone.")}
  finiteNumber(s.minutesPerDay,"Daily target",15,480);
  finiteNumber(s.daysPerWeek,"Days per week",1,7);
  finiteNumber(s.activeWeek,"Active week",1,24);
  if(!Number.isInteger(s.activeWeek)||!Number.isInteger(s.daysPerWeek))fail("Weeks and days must be whole numbers.");
  if(s.startDate!==null&&!validDate(s.startDate))fail("Invalid start date.");
  if(typeof s.paused!=="boolean")fail("Invalid pause setting.");
  return {timezone:s.timezone,minutesPerDay:s.minutesPerDay,daysPerWeek:s.daysPerWeek,
    activeWeek:s.activeWeek,startDate:s.startDate,paused:s.paused,lastBackupAt:typeof s.lastBackupAt==="string"?s.lastBackupAt:null};
}
export function validateLegacy(raw) {
  if(!raw||raw.version!==1||!raw.days||Array.isArray(raw.days)||typeof raw.days!=="object")fail("This is not a supported Java planner backup.");
  const entries=Object.entries(raw.days);
  if(entries.length>366)fail("Legacy file contains too many days.");
  for(const [id,d] of entries) {
    if(!/^\d+$/.test(id)||!d||!Array.isArray(d.learn)||!Array.isArray(d.practice)||
       [...d.learn,...d.practice].some(v=>typeof v!=="boolean"))fail("Invalid legacy day data.");
  }
  return raw;
}
export function validateBackup(raw,seed) {
  if(!raw||raw.kind!=="progress-backup"||![1,2,3].includes(raw.schemaVersion))fail("Unsupported backup type or version.");
  if(raw.curriculumVersion!==seed.curriculumVersion)fail("This backup uses a different curriculum version. Nothing was changed.");
  const settings=validateSettings(raw.settings);
  const result={...raw,settings,studyEntries:raw.studyEntries||[],careerEntries:raw.careerEntries||[],careerProfile:normalizeCareer(raw).careerProfile};
  if(raw.schemaVersion>=2&&(!raw.careerEntries||!raw.careerProfile))fail("Missing preparation data.");
  if(raw.schemaVersion===3&&!raw.studyEntries)fail("Missing calendar data.");
  validateStudyEntries(result.studyEntries,seed);
  validateCareerEntries(result.careerEntries);validateCareerProfile(result.careerProfile);
  const pids=new Set(seed.problems.map(p=>p.id)), sids=new Set(seed.roadmap.map(w=>w.systemDesignId)), jids=new Set(seed.javaHelp.map(j=>j.id));
  for(const type of ["attempts","systemDesignEntries","javaRevisionEntries","legacyImports"]) {
    if(!Array.isArray(raw[type])||raw[type].length>50000)fail(`Invalid ${type} list.`);
    const ids=new Set();
    for(const e of raw[type]) {if(!e?.id||ids.has(e.id))fail(`Missing or repeated event ID in ${type}.`);ids.add(e.id)}
  }
  for(const e of raw.attempts) {
    commonEvent(e,pids,"problemId","Attempt");
    if(!OUTCOMES.includes(e.outcome)||!["None","Hint","Solution / AI"].includes(e.help))fail("Invalid attempt outcome or help.");
    if(typeof e.testsPassed!=="boolean"||typeof e.canExplain!=="boolean")fail("Invalid attempt checks.");
    if(e.confidence!==null){finiteNumber(e.confidence,"Confidence",1,5);if(!Number.isInteger(e.confidence))fail("Confidence must be a whole number.")}
    string(e.notes,"Attempt notes"); if(e.code!==undefined)string(e.code,"Code");
    if(e.solutionUrl!==undefined)string(e.solutionUrl,"Solution link",2000);
  }
  for(const e of raw.systemDesignEntries) {
    commonEvent(e,sids,"systemDesignId","Design");
    if(!DESIGN_STATUSES.includes(e.status))fail("Invalid design status.");
    for(const key of ["requirements","flow","data","tradeoff","failure","artifact"])string(e[key],key);
    if(e.status==="Reviewed" && (!e.confirmed||["requirements","flow","data","tradeoff","failure","artifact"].some(k=>!e[k].trim())))fail("A reviewed design is missing its evidence.");
  }
  for(const e of raw.javaRevisionEntries) {
    commonEvent(e,jids,"javaHelpId","Java revision");
    if(e.problemId!==null&&!pids.has(e.problemId))fail("Unknown Java revision task.");
    string(e.takeaway,"Revision takeaway");
    if(typeof e.blockerResolved!=="boolean")fail("Invalid blocker flag.");
  }
  for(const e of raw.legacyImports){string(e.sha256,"Legacy hash",100);validateLegacy(e.payload)}
  return result;
}
function canonical(value) {
  if(Array.isArray(value))return "["+value.map(canonical).join(",")+"]";
  if(value&&typeof value==="object")return "{"+Object.keys(value).sort().map(k=>JSON.stringify(k)+":"+canonical(value[k])).join(",")+"}";
  return JSON.stringify(value);
}
export function mergeBackup(state,backup,{conflict="reject",importSettings=false}={}) {
  const merged=normalizeStudy(normalizeCareer(structuredClone(state)));let added=0,duplicates=0,conflicts=0;
  for(const type of ["attempts","systemDesignEntries","javaRevisionEntries","legacyImports","careerEntries","studyEntries"]) {
    const map=new Map(merged[type].map(e=>[e.id,e]));
    for(const e of (backup[type]||[])) {
      const prior=map.get(e.id);
      if(!prior){map.set(e.id,e);added++}
      else if(canonical(prior)===canonical(e)||(type==="legacyImports"&&prior.sha256===e.sha256&&canonical(prior.payload)===canonical(e.payload))){duplicates++}
      else {conflicts++;if(conflict==="import")map.set(e.id,e)}
    }
    merged[type]=[...map.values()];
  }
  if(conflicts && conflict==="reject")fail(`${conflicts} conflicting event ID(s). Choose which copy to keep.`);
  if(importSettings){merged.settings=backup.settings;if(backup.schemaVersion>=2&&backup.careerProfile)merged.careerProfile=backup.careerProfile;}
  return {state:normalizeCareer(merged),added,duplicates,conflicts};
}
export function safeUrl(value) {
  try{const u=new URL(value);return ["http:","https:"].includes(u.protocol)?u.href:null}catch{return null}
}
