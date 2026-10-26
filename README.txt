DSA NOW - JAVA DSA, SYSTEM DESIGN, DAILY PLANNER

START
Double-click Start-DSA.cmd. Run it again after restarting the computer.
Use http://127.0.0.1:48260 in the same browser every time.

USE
DSA Sheet: select a topic, solve in Java, log the attempt and actual minutes.
Revision is inside the sheet. Use the problem's Java help only when needed.
System Design: choose a topic, keep notes and log a design session.
Daily Planner: the full remaining DSA sheet and design practice are pre-filled.
Click a date to see its topics, detailed to-dos and planned minutes.
Full days use your daily goal; weekly catch-up days use half.
Add your own topics whenever needed. Reloading keeps your schedule unchanged.
Existing planned days are preserved. Remove and re-add a plan to change it.

TIME
The daily total combines problem, design, Java refresher and separate time logs.
Mark done only changes the plan status. It does not add minutes or solve a task.
Do not log the same minutes both with a problem and as separate calendar time.
Set your daily goal using the settings button in the top-right corner.

DATA
Everything saves in your browser profile. There is no cloud progress sync.
Export a JSON backup regularly; clearing browser data can erase your work.
Version 3 backups include calendar plans and time logs. Older backups still work.
The repository starts without personal data; your existing local records survive
an update because the same database and task IDs are used.
Old preparation records remain in the activity archive and exported backups.

ONLINE
Vercel serves the dist directory using vercel.json. Moving from localhost to the
online domain requires exporting your local backup and importing it online.

DEVELOPMENT
Node.js 20+; no dependencies. npm start launches the local server.
npm test runs 18 domain tests. Separate QA origin: node server.mjs 48262.
