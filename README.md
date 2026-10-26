# DSA Now

A local Java DSA and career preparation tracker, focused on Google and other eligible India student / early-career software roles.

![DSA Now dashboard](preview.png)

## Run locally

Use Node.js 20 or newer. No package installation is needed; there are no runtime dependencies.

```sh
git clone https://github.com/Mandar444/JAVA.git
cd JAVA
npm start
```

Open **http://127.0.0.1:48260**. On Windows, you can instead double-click `Start-DSA.cmd`; it checks the local bundled Node runtime and then Node on PATH. Run the launcher again after restarting your computer.

The server listens only on `127.0.0.1`. Pushing this repository does not deploy the website.

## Features

- 156 original Java DSA tasks: 96 core and 60 optional across 26 modules.
- A 22-week plan: October 26, 2026 to March 31, 2027, including buffer days.
- Adjustable two-hour daily rhythm: 70 minutes DSA, 20 revision, 30 supporting work.
- Spaced revision, independent-solve evidence and retention tracking.
- 29 milestones for CS fundamentals, a Java project, behavioral stories and career setup.
- Mock feedback, application stages, activity history and a design notebook.
- Targeted Java revision instead of restarting the language.
- Company interview guidance with official sources checked October 26, 2026.
- Responsive desktop/mobile UI and JSON backup import/export.

Exercises and mock scores are self-reported practice tools. The app does not execute Java or predict hiring outcomes. Interview formats vary by role, location and recruiter instructions. Plan dates are preparation targets, not company application deadlines.

## Your data

Progress stays in **IndexedDB in your browser profile**. Use the same browser and exact address every time. Different browsers, ports, `localhost` and `127.0.0.1` have separate storage.

Use **Settings & backups → Export progress JSON** regularly. Clearing browser data can erase progress. Version 2 backups include attempts, design/Java sessions, preparation records, mocks, applications and preferences. Version 1 progress backups and the original Java planner backup format are also supported.

The repository starts with empty progress. Personal planner records and browser databases are excluded. No accounts, analytics, cloud sync or automatic application submissions. External resource links require internet when opened.

## Development

```sh
npm test
```

The 14 tests cover reviews, migration, validation, backup compatibility, deduplication, merge conflicts and core-task coverage.

- `dist/`: browser UI, curriculum, IndexedDB storage and progress logic.
- `dist/career-data.mjs`: roadmap, milestones and official research sources.
- `dist/career-domain.mjs` and `dist/career-ui.mjs`: preparation tracking and screens.
- `tests/`: Node test suite.
- `server.mjs`: local static server.
- `Start-DSA.cmd` / `Start-DSA.ps1`: Windows launcher.
- `README.txt`: detailed operating instructions.

For an isolated test workspace, run `node server.mjs 48261`. Keep everyday progress on port 48260.
