export function normalizeStudy(state){return {...state,studyEntries:state.studyEntries||[]};}
export function latestPlans(state){const m=new Map();for(const e of [...(state.studyEntries||[])].filter(e=>e.kind==='plan').sort((a,b)=>a.occurredAt.localeCompare(b.occurredAt)||a.id.localeCompare(b.id)))m.set(e.itemId,e);return [...m.values()];}
export function studyMinutes(state,date){const sum=a=>a.filter(e=>e.localDate===date).reduce((n,e)=>n+(e.minutes||0),0),extra=(state.studyEntries||[]).filter(e=>e.kind==='session'&&e.date===date);return {dsa:sum([...state.attempts,...state.javaRevisionEntries])+extra.filter(e=>e.track==='DSA').reduce((n,e)=>n+e.minutes,0),design:sum(state.systemDesignEntries)+extra.filter(e=>e.track==='System design').reduce((n,e)=>n+e.minutes,0)};}
export function validateStudyEntries(entries,seed){if(!Array.isArray(entries)||entries.length>50000)throw Error('Invalid study records.');const ids=new Set(),targets=new Set([...seed.problems.map(p=>p.id),...seed.roadmap.map(w=>w.systemDesignId)]);for(const e of entries){if(!e||typeof e.id!=='string'||!e.id||ids.has(e.id)||typeof e.itemId!=='string'||!e.itemId||e.id.length>150||e.itemId.length>150)throw Error('Invalid study record ID.');ids.add(e.id);if(!['plan','session'].includes(e.kind)||typeof e.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(e.date)||!Number.isFinite(Date.parse(e.date))||new Date(e.date+'T12:00:00Z').toISOString().slice(0,10)!==e.date||typeof e.occurredAt!=='string'||!Number.isFinite(Date.parse(e.occurredAt)))throw Error('Invalid study date.');if(!Number.isInteger(e.minutes)||e.minutes<1||e.minutes>1440||typeof e.notes!=='string'||e.notes.length>100000)throw Error('Enter whole minutes between 1 and 1440.');if(e.kind==='plan'&&(!targets.has(e.targetId)||!['Planned','Done','Skipped'].includes(e.status)))throw Error('Invalid planned topic or status.');if(e.kind==='session'&&!['DSA','System design'].includes(e.track))throw Error('Choose a study track.');}return entries;}

// Persist the initial curriculum once; reloads must never recreate removed plans.
export function prefilledPlans(state, seed, startDate, occurredAt = new Date().toISOString()) {
  if ((state.studyEntries || []).some(e => e.id.startsWith('prefill-v1-'))) return [];
  const existing = latestPlans(state);
  const occupied = new Set(existing.map(e => e.date));
  const scheduled = new Set(existing.filter(e => e.status !== 'Skipped').map(e => e.targetId));
  const solved = new Set(state.attempts.filter(e => e.outcome === 'Solved independently' && e.testsPassed && e.canExplain).map(e => e.problemId));
  const ordered = [...seed.problems.filter(p => p.track === 'Core'), ...seed.problems.filter(p => p.track !== 'Core')];
  let problems = ordered.filter(p => !scheduled.has(p.id) && !solved.has(p.id));
  const reviewOnly = !problems.length;
  if (reviewOnly) problems = ordered.filter(p => p.track === 'Core');
  const budget = state.careerProfile?.dailyMinutes || state.settings.minutesPerDay || 120;
  const studyDays = state.careerProfile?.daysPerWeek || state.settings.daysPerWeek || 6;
  const dayAfter = n => { const d = new Date(startDate + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0,10); };
  const records = [];
  let next = 0, activeDay = 0;
  for (let offset = 0; next < problems.length && offset < 1095; offset++) {
    const date = dayAfter(offset);
    if (occupied.has(date)) continue;
    const light = offset % 7 >= studyDays;
    const problem = problems[light ? Math.max(0, next - 1) : next];
    const designIndex = Math.max(0, activeDay - (light ? 1 : 0));
    const design = seed.roadmap[designIndex % seed.roadmap.length];
    const phase = Math.floor(designIndex / seed.roadmap.length) % 4;
    const total = light ? Math.max(15, Math.round(budget / 2)) : budget;
    const dsaMinutes = Math.round(total * .75);
    const dsaNotes = light
      ? `Review / catch-up day\nRe-solve ${problem.title} without looking at your notes.\nRevisit any unfinished problem from this week.\nWrite down one mistake to avoid next time. Stop early if caught up.`
      : `${reviewOnly ? 'Independent revision' : 'Practice in Java'}\nUnderstand ${problem.title}; work through a small example.\nWrite a simple solution, then improve it if needed.\nTest edge cases and explain time and space complexity.\nSave your attempt and the minutes you actually studied.`;
    const designSteps = [
      'Learn the basic concept and define the key terms.\nDraw a simple request or data flow.\nExplain one tradeoff in your own words.',
      'Revisit your notes, then close them.\nSketch a small example that uses this concept.\nExplain why you chose each component.',
      'Explain what happens if traffic grows or a component fails.\nCompare two possible approaches.\nWrite down the tradeoff you would choose.',
      'Explain the concept aloud without notes.\nRedraw the flow from memory.\nCheck your notebook and fix gaps.'
    ];
    for (const [track, targetId, minutes, notes] of [
      ['dsa', problem.id, dsaMinutes, dsaNotes],
      ['design', design.systemDesignId, total - dsaMinutes, light ? 'Light design review\nRecall the latest concept without notes.\nFix one unclear point in your notebook.' : `System design · ${['Learn','Apply','Compare','Recall'][phase]}\n${designSteps[phase]}`]
    ]) {
      const id = `prefill-v1-${date}-${track}`;
      records.push({id,itemId:id,kind:'plan',date,occurredAt,targetId,minutes,status:'Planned',notes});
    }
    if (!light) { next++; activeDay++; }
  }
  validateStudyEntries(records,seed);
  return records;
}
