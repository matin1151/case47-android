# Room Six: requested playtest revision

Date: 2026-11-04. Case version: 0.3.0-playtest.
Branch: codex/room-six. This is a playable web checkpoint, not an Android or store release.

## Changes

The recovered November 3 feedback is implemented as follows:

| Request | Result |
| --- | --- |
| Remove image zoom; modestly enlarge room views | Fixed images without zoom actions; wider scene column and mobile margins |
| Plausible villa map and enclosed bathroom | Dimensioned native plan with unequal rooms, corridor, closed service rooms, furniture, door swings and fixed study glass |
| Identify rooms and their users | Scene descriptions identify purpose, occupant and physical document locations |
| Property archive and library | New environment atlas adds stocked archive shelves, a library and a foreground terrace table |
| Clarify archive's third item | E10 is an annotated site plan with a separate old-search attachment, explicit source and limits |
| Explain common-reference measurements | E03 gives a four-step method and distinguishes total difference from useful space; no answer displayed before solving |
| Independent, readable exhibits | Each of the 21 exhibits has its own representation; maps, ledgers, transcripts, receipts, call log and messages are different, readable records |
| D6 video call | E15 shows a large phone frame containing Saman; E16 audio-call record and E17 chat are separate exhibits |
| Two matching paper fragments | E18/E19 have visible text and complementary tears, a rotation control and linked orientation input; comparison appears only after finding both pieces |
| Accessible missing-map clue | E01 names the blue property folder in the initially accessible archive; paper clue likewise names its terrace envelope |
| Compact evidence notebook | Smaller cards and summaries retain full records in the detail dialog |
| Fuller interviews, concerned expressions | Expanded question wording and a revised portrait atlas; all survivors express concern without marking a culprit |
| Optional help everywhere | Section help plus individual deduction and confrontation hints |
| Natural evidence placement | Scene-specific hotspot coordinates, named desks/shelves/envelopes and a new terrace table |
| Remove puzzle search/type filters | Room Six puzzle picker lists discovered documents directly; selection chips preserve multiple simultaneous selections |
| Second-proof acceptance | Regression tests reproduce incomplete selection, add the second primary record, then successfully solve; relevant supporting evidence is explicitly allowed where appropriate |
| Long, quiet commercial-use music | Original synthesized 384-event score, approximately 696 seconds before repeating; no external recording or short repeating melody |

Evidence identifiers and save keys are unchanged. Existing investigation progress is retained. The unrecovered conversation fragment is not claimed as implemented.

## Artwork and audio provenance

The environment and portrait atlases were revised using the built-in image generator from the repository's existing reference atlases. New files: `environments-v3.jpg`, `portraits-v3.jpg`, `raha-archive-v3.jpg`. The standalone archival photo makes the elongated leaf pendant match the recovered object clearly. Original atlases are retained. The new artwork is available for Matin's visual review; it has not been labeled user-approved.

The environment prompt specifies a six-panel modern villa atlas with a furnished archive, library, guest room, terrace table, office and old tank. The portrait prompt preserves the six identities and clothing, adds concern equally, removes panel labels, and places Raha beside archive shelves. Generated text is not used for clue data: all dimensions, messages, times and document writing are rendered from the case records.

Room Six's new synthesized composition in `web/audio.js` was written for Bidrano in this revision. It uses oscillators and procedural noise only, with no third-party music samples or downloaded track. Bidrano may distribute this original score commercially with the game. This statement does not change licenses of existing third-party fonts or code dependencies.

## Validation

- 38 engine and case regression tests passed, including a complete investigation and independent endings.
- Room Six browser checks on 390px and 1280px: fixed images, section help, direct proof selection, rejected/correct measurement, two-proof synchronization, paper rotation, independent reports, retry and reload.
- Original Case 47 browser playthrough and responsive checks at 320, 360, 390, 768 and 1280px.
- Room Six Web Audio check: score length 384; duration 696 seconds; running and pause states; first 16 notes are not repeated as the next phrase.
- Mobile screenshots inspected for map, library, archive, terrace and video-call exhibit.

No APK was built and no real Android device or store submission was tested. Music's subjective feel and the revised art remain appropriate for a final user playthrough.
