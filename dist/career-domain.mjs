import {prepTasks} from './career-data.mjs';
export const careerDefaults=()=>({week:1,country:'India',graduation:'',dailyMinutes:120,daysPerWeek:6});
export const latestCareer=(entries,kind,itemId)=>entries.filter(e=>e.kind===kind&&e.itemId===itemId).sort((a,b)=>a.occurredAt.localeCompare(b.occurredAt)||a.id.localeCompare(b.id)).at(-1);
export function normalizeCareer(state){const profile=state.careerProfile||careerDefaults();return {...state,settings:{...state.settings,minutesPerDay:profile.dailyMinutes,daysPerWeek:profile.daysPerWeek},careerEntries:state.careerEntries||[],careerProfile:profile};}
export function validateCareerProfile(p){
 if(!p||!Number.isInteger(p.week)||p.week<1||p.week>22||!Number.isInteger(p.dailyMinutes)||p.dailyMinutes<30||p.dailyMinutes>360||!Number.isInteger(p.daysPerWeek)||p.daysPerWeek<1||p.daysPerWeek>7)throw Error('Invalid preparation preferences.');
 if(typeof p.country!=='string'||p.country.length>100||typeof p.graduation!=='string'||p.graduation.length>80)throw Error('Invalid country or graduation details.');
 return p;
}
export function validateCareerEntries(entries){
 if(!Array.isArray(entries)||entries.length>50000)throw Error('Invalid preparation record list.');
 const ids=new Set(),taskIds=new Set(prepTasks.map(t=>t.id));
 for(const e of entries){
  if(!e||typeof e.id!=='string'||!e.id||e.id.length>150||ids.has(e.id))throw Error('Invalid or duplicate preparation record ID.');
  ids.add(e.id);
  if(!['task','mock','application'].includes(e.kind)||typeof e.itemId!=='string'||!e.itemId||e.itemId.length>150)throw Error('Invalid preparation record type.');
  if(typeof e.occurredAt!=='string'||Number.isNaN(Date.parse(e.occurredAt))||typeof e.localDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(e.localDate)||new Date(e.localDate+'T12:00:00Z').toISOString().slice(0,10)!==e.localDate)throw Error('Invalid preparation date.');
  if(!Number.isFinite(e.minutes)||e.minutes<0||e.minutes>1440)throw Error('Invalid preparation duration.');
  for(const key of ['notes','title','status'])if(typeof e[key]!=='string'||e[key].length>100000)throw Error('Invalid preparation text.');
  if(e.kind==='task'&&(!taskIds.has(e.itemId)||!['Learning','Practising','Done'].includes(e.status)||(e.status==='Done'&&!e.notes.trim())))throw Error('Completed preparation tasks need evidence.');
  if(e.kind==='mock'){
   if(!['Coding','OA practice','Behavioral','Design'].includes(e.status)||!Array.isArray(e.scores)||e.scores.length!==5||e.scores.some(n=>!Number.isInteger(n)||n<0||n>4)||!e.notes.trim())throw Error('Mock needs five rubric scores and feedback.');
  }
  if(e.kind==='application'){
   if(!['Saved','Applied','OA','Interview','Offer','Closed'].includes(e.status))throw Error('Invalid application stage.');
   for(const key of ['company','url','deadline','nextAction','location'])if(typeof e[key]!=='string'||e[key].length>3000)throw Error('Invalid application field.');
   if(e.deadline&&(!/^\d{4}-\d{2}-\d{2}$/.test(e.deadline)||Number.isNaN(Date.parse(e.deadline))||new Date(e.deadline+'T12:00:00Z').toISOString().slice(0,10)!==e.deadline))throw Error('Invalid application deadline.');
   if(e.url){let u;try{u=new URL(e.url)}catch{throw Error('Use a valid role URL.')}if(!['http:','https:'].includes(u.protocol))throw Error('Use an http or https role URL.');}
  }
 }
 return entries;
}
