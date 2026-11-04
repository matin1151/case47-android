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

## Visual checkpoint 0.2.0
Approved golden forest, modern villa, room views, seated character portraits, evidence and closeups are connected. Room/evidence images support zoom. All six JPEG sprite assets are embedded in the standalone HTML; source dimensions preserved. Mobile grid sizing corrected. Remaining: visual paper manipulation, narrative expansion and Android package.

## Playtest revision 0.3.0 (2026-11-04)
Recovered November 3 changes supersede the earlier zoom checkpoint: zoom is removed, scenes have specific identities and natural evidence positions, unique readable exhibits replace repeated generic images, the map and missing-document clues are explicit, and the puzzle picker supports direct multi-selection. New library/archive/terrace artwork, concerned portraits, paper rotation and a long original offline score are connected. See `ROOM-SIX-PLAYTEST-REVISION.md` for request mapping, provenance and verification. New artwork awaits user visual review. Android packaging remains separate.

## Approved portrait revision 0.3.1
Matin approved the revised portraits on 2026-11-04. The active portrait atlas is `portraits-v4.jpg`: restrained, individual expressions of concern for the other characters. Raha's evidence photograph is `raha-souvenir-v4.jpg`, a happy souvenir portrait beside the living-room window with the forest and sofa in view. E06 title, summary, body, finding location versus photograph location, scene label, accessible image description, and the pendant deduction now agree. The photo no longer claims to show the archive or prove presence in it. The found pendant and photograph support object comparison only; the remaining evidence chain is unchanged.

## Readability revision 0.3.2
Text cards now use opaque dark surfaces and lighter secondary text over the forest. Every interview next-step guide places the instruction on its own line, followed by the direct question on the next line. Saman's first question reads «خروج رها را دیدی؟». The enlarged wall illustration in E22 is replaced with a readable inspection record; the evidence and original room view are retained. No image zoom control is provided.

## Engagement revision 0.4.0
The first clue now has a consequential opening choice with a recoverable slower route. A visible detective workflow and actionable next steps guide scene inspection, interviews, claim checks, chronology and independent reports. All ten deduction guides and four confrontation guides have three concrete levels and a final placement aid for discovered documents. Direct contradictory evidence is sufficient for the limited claim, while the full report still requires its original chain. New milestone messages persist without reward farming. A faster repeating melody and quiet forest ambience replace the earlier sparse/rain profile. The sale preparation and reason for the gathering are explicit in the introduction, Leila's dialogue and E01. See `ROOM-SIX-ENGAGEMENT-REVIEW.md` for scope and verification.
