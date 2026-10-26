export const RESEARCH_DATE='2026-10-26', PLAN_START='2026-10-26', PLAN_END='2027-03-31';
export const sources=[
{id:'google-video',title:'Google · How We Hire',url:'https://www.youtube.com/watch?v=zhUgaKb0s5A',note:'Official Life at Google video, 2019. General overview, not a current India round-count guarantee.'},
{id:'google-tips',title:'Google · Technical interview advice',url:'https://blog.google/company-news/inside-google/life-at-google/google-engineer-shares-her-technical-interview-tips/',note:'Official article, 2022. Algorithms and explaining your reasoning aloud.'},
{id:'google-guide',title:'Google · Virtual interview guide',url:'https://services.google.com/fh/files/misc/general_virtual_interviews_candidate_resource.pdf',note:'Official logistics guide. Your invitation determines the actual format.'},
{id:'ms-tech',title:'Microsoft · Technical interviewing',url:'https://careers.microsoft.com/v2/global/en/hiring-tips/technical-interviewing',note:'Problem solving, coding, testing, DSA and role-dependent design.'},
{id:'ms-hire',title:'Microsoft · How we hire',url:'https://careers.microsoft.com/v2/global/en/hiring-tips',note:'Most interviews: 2–4 conversations of up to an hour; role variation applies.'},
{id:'ms-behavior',title:'Microsoft · Interview tips',url:'https://careers.microsoft.com/v2/global/en/hiring-tips/interview-tips',note:'Examples, collaboration and STAR(R): situation, task, action, result, reflection.'},
{id:'amazon',title:'Amazon · University SDE assessments',url:'https://www.amazon.jobs/content/de/how-we-hire/university-roles/sde',note:'English content at this locale URL. Coding/work styles; country and role determine structure.'},
{id:'netflix',title:'Netflix · New graduates',url:'https://www.jobs.netflix.com/careers/new-grads',note:'US program: typically take-home assessment and two interview rounds. Not an India hiring promise.'},
{id:'apple',title:'Apple · Students',url:'https://www.apple.com/careers/us/work-at-apple/students.html',note:'Student internship overview, without a universal SWE interview loop.'},
{id:'google-jobs',title:'Google · Role search',url:'https://www.google.com/about/careers/applications/jobs/results/',note:'Check India postings, degree, graduation window, availability and deadlines.'}
];
export const companies=[
{name:'Google',tag:'Primary target',headline:'Make your thinking visible.',stages:['Application & eligibility','Preliminary screening','Technical interviews','Decision / next steps'],facts:'Google’s official overview describes application, preliminary screening and interviews. Its engineering advice emphasizes algorithms and explaining reasoning. Current India internship/new-grad round counts were not verifiable from accessible official material.',prepare:'Java DSA: clarify constraints, explain a baseline, improve it, code and test. Prepare teamwork and project examples too.',confirm:'Confirm OA, coding-round count, behavioral/design conversations and permitted editor/tools with your recruiter.',sourceIds:['google-video','google-tips','google-guide','google-jobs']},
{name:'Microsoft',tag:'Second target',headline:'Code it. Test it. Explain the choice.',stages:['Application review','Possible screen','Interview conversations','Outcome'],facts:'Microsoft describes most interviews as 2–4 conversations of up to an hour. Its technical guide covers problem solving, design, coding and testing; coverage depends on the role.',prepare:'Use Java fluently, explain complexity, test boundaries and discuss project choices. Rehearse collaboration, feedback and growth examples.',confirm:'Confirm your India campus/internship loop, OA and design depth.',sourceIds:['ms-tech','ms-hire','ms-behavior']},
{name:'Amazon',tag:'Shared preparation',headline:'Technical ability plus ownership.',stages:['Application','Online assessment','Interviews if advanced','Outcome'],facts:'The university SDE guide covers coding and work styles. Full-time and internship structures differ; the invitation determines the country format.',prepare:'Timed coding and honest ownership, customer focus and learning examples. Read Leadership Principles before interviewing.',confirm:'Use your OA email for timing, sections and rules. Experienced SDE-II loops are not student templates.',sourceIds:['amazon']},
{name:'Meta / Apple / Netflix',tag:'Selective opportunities',headline:'Check the role before the company label.',stages:['Eligible role','Verify local process','Adapt shared skills','Apply deliberately'],facts:'Apple’s student page does not specify a fixed SWE loop. Netflix’s cited program is US-focused. Meta’s official guide was inaccessible during review; a student/India loop is not asserted.',prepare:'Reuse DSA, project and behavioral skills. Add team-specific topics when required by a relevant role.',confirm:'Verify India availability, experience and location. There is no single FAANG interview process.',sourceIds:['apple','netflix']}
];
const t=(id,track,title,week,prompt,done)=>({id,track,title,week,prompt,done});

export const prepTasks=[
t('CS01','CS fundamentals','Complexity and Java collections',1,'Compare arrays, ArrayList, HashMap, HashSet, ArrayDeque and PriorityQueue. Cover average/worst case, boxing and equality.','Explain operations without notes and demonstrate equals/hashCode.'),
t('CS02','CS fundamentals','OOP with a small model',3,'Model a task and revision policy. Explain interfaces, composition and immutability.','Write a small Java model and test one design choice.'),
t('CS03','CS fundamentals','SQL and relational modeling',5,'Model tasks/attempts. Write joins, GROUP BY and latest-attempt queries.','Save a schema and five working queries with expected results.'),
t('CS04','CS fundamentals','Indexes and transactions',7,'Explain indexes, ACID, isolation and a concurrent update race.','Demonstrate an indexed query and a transaction preventing an invalid update.'),
t('CS05','CS fundamentals','Processes, threads and memory',8,'Compare process/thread, stack/heap, virtual memory and context switching.','Give a two-minute explanation and identify a shared-state race.'),
t('CS06','CS fundamentals','Concurrency and deadlocks',10,'Use a counter to explain locks, atomics and deadlock conditions.','Show a safe counter; explain why volatile does not make increment atomic.'),
t('CS07','CS fundamentals','A request across the network',11,'Trace DNS, TCP, TLS, HTTP and a response. Compare TCP/UDP and HTTP methods/statuses.','Draw the path; identify timeouts, authentication and retries.'),
t('CS08','CS fundamentals','Testing and debugging',12,'Compare unit/integration tests. Reproduce and isolate a defect.','Save a failing case, cause, fix and regression test.'),
t('CS09','CS fundamentals','Git and Linux basics',13,'Practise branches, merge conflicts, logs, processes, pipes and environment variables.','Explain a real Git workflow and debug a local process.'),
t('CS10','CS fundamentals','Fundamentals oral mock',16,'Answer ten mixed OS, DBMS, networking and OOP questions aloud.','Record weak topics and redo the explanations on a later day.'),
t('P01','Project lab','Choose one useful Java project',2,'Suggested: learning tracker backend. Define three user needs, endpoints and exclusions.','One-page scope and repository README.'),
t('P02','Project lab','Build one vertical slice',4,'Implement a Java API to add/retrieve attempts. Learn framework features only as needed; Spring Boot is optional.','Runnable request → validation → storage → response.'),
t('P03','Project lab','Persist real data',6,'Add relational storage, schema migrations and validation. Keep secrets out of the repository.','Data survives restart; malformed input fails clearly.'),
t('P04','Project lab','Make correctness visible',9,'Add unit/integration tests for normal, boundary and failure paths.','Repeatable tests and one documented regression fix.'),
t('P05','Project lab','Handle failure and access',12,'Add consistent errors and an access model. Document the local-only boundary if there is no login.','Demonstrate bad input, missing data and a failed dependency.'),
t('P06','Project lab','Measure one improvement',14,'Measure a slow operation before/after an index or algorithm change.','Save setup, measurements and limitations. No invented impact.'),
t('P07','Project lab','Make the project reviewable',16,'Finish README, architecture sketch, API examples and short demo. A local demo is sufficient.','A classmate can run it from your instructions.'),
t('P08','Project lab','Defend engineering choices',18,'Give a five-minute walkthrough: problem, architecture, bug, tests, tradeoff and next step.','Rehearse follow-ups; write two truthful resume bullets.'),
t('B01','Story bank','Introduce yourself',2,'Draft a 60–90 second introduction: study, interests, strongest project and contribution.','Speak naturally without reading a script.'),
t('B02','Story bank','Collaboration and disagreement',5,'Describe a real disagreement: situation, task, action, result, reflection.','Explain your contribution and consideration of another view.'),
t('B03','Story bank','Failure and recovery',8,'Describe a real mistake and what changed afterwards.','Concrete action and lesson without blame.'),
t('B04','Story bank','Ownership under ambiguity',11,'Describe unclear requirements and how you clarified the goal.','Distinguish your contribution from the team’s.'),
t('B05','Story bank','Feedback and learning',14,'Describe difficult feedback and how you used it.','Evidence of changed behavior or implementation.'),
t('B06','Story bank','Behavioral practice loop',17,'Practise five stories and why this role/company. Ask a peer to probe details.','Save feedback; retell the weakest story. Avoid slogans.'),
t('A01','Career setup','Confirm eligibility and dates',1,'Enter your actual graduation month/year, degree, exam weeks and availability. Compare with live India postings.','Record exact criteria and deadlines for eligible roles.'),
t('A02','Career setup','Create a one-page resume',2,'Use education, skills and project evidence you can explain.','Reviewed PDF with working links and no fabricated numbers.'),
t('A03','Career setup','Review openings each week',3,'Check Google/Microsoft India careers and your placement channel. Apply when eligible, not only in March.','Save a verified role or dated note that none matched. Repeat weekly.'),
t('A04','Career setup','Get useful feedback',6,'Ask a peer, mentor or alumni contact to review your resume/project.','Save feedback and an improvement. Contact people yourself; this tracker sends nothing.'),
t('A05','Career setup','Prepare the interview setup',17,'Confirm format, language, editor, time zone, equipment and permitted resources.','Save recruiter instructions and two interviewer questions.')
];
export const phases=[
{weeks:'01–04',name:'Build your base',detail:'Arrays, strings, hashing, windows and prefix sums. Start resume and project.'},
{weeks:'05–08',name:'Think in structures',detail:'Sorting, search, lists, stacks, queues and recursion. Explain and test.'},
{weeks:'09–12',name:'Connect the patterns',detail:'Backtracking, bits, trees, heaps and greedy. Add timed mocks.'},
{weeks:'13–16',name:'Reason through harder work',detail:'Graphs, DSU, tries, dynamic programming and mixed tasks. Finish the project.'},
{weeks:'17–22',name:'Rehearse the interview',detail:'Unseen problems, weak-pattern redos, stories and applications.'}
];
export function makeWeeks(seed){
const core=seed.problems.filter(p=>p.track==='Core');
return Array.from({length:22},(_,i)=>({week:i+1,ids:i<16?core.slice(i*6,i*6+6).map(p=>p.id):[],
title:i<16?[...new Set(core.slice(i*6,i*6+6).map(p=>seed.modules.find(m=>m.id===p.moduleId).title))].join(' + '):['Mixed coding & review','Project and story rehearsal','OA-style practice','Full interview rehearsal','Repair weak patterns','Readiness review'][i-16],
parallel:prepTasks.filter(t=>t.week===i+1).map(t=>t.id),mock:i<4?'Explain one solution aloud':i<8?'One 20-minute peer discussion':i<16?'One 45-minute coding mock':'Two 45-minute coding mocks + review'}));
}
