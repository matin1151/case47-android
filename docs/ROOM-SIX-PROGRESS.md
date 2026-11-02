# Room Six development checkpoint
Date: 2026-11-02

This branch contains a developer prototype, not a store release.

Implemented:
- Separate catalog entry and save key for Room Six.
- 21 evidence records, four interviewable survivors, 10 deductions, four claim confrontations.
- Villa map; hidden archive and external investigation unlock through independent evidence chains.
- Numeric measurement, clock correction and paper orientation inputs; interactive timeline reconstruction.
- Independent report sections for the historic disappearance and present homicide; incomplete reports preserve progress.
- Separate engine extension leaves Case 47 report logic intact.
- Offline standalone build with CSP script hashes: node tools/build_web.cjs.

Validation:
- node --test tests/engine.test.cjs tests/room-six.test.cjs: 34 passed.
- Room Six browser checks at 390px and 1280px: passed. Covers catalog, map, document view, rejected/correct measurement, Persian digits, partial report, retry and reload.
- Windows browser test: set CHROMIUM_PATH to installed Chrome, then node tests/room-six-ui.test.cjs.
- No APK produced or Android device test performed in this checkpoint.

Remaining:
- Connect approved forest/villa/portrait assets, individual close-ups and zoom; current Room Six scenes use a neutral development background.
- Replace text-based paper rotation with visual manipulation and evidence annotation.
- Expand narrative pacing, five acts and dialogues; this short prototype does not establish a 90–120 minute playtime.
- Review realism of the old search and camera continuity with final visual assets.
- Package and verify a separate Android test application before release.
- No purchase or store publishing configured for Room Six.

User requirement:
After each completed development stage, checkpoint the latest source and tests on codex/room-six and provide its commit link.
