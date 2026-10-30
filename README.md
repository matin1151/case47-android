# Case 47: The Last Call

An offline, Persian-language detective game for Android. This repository contains the game source, its data-driven case engine, the first playable case, tests, and a small native Android WebView shell. The game series has not been named.

The first case is free. The app opens on detective Sam Naderi's desk, where players can start or resume cases and see which ones they have solved. Case 47 follows the death of Arman Rad in a locked office. Players examine three locations, interview three suspects, test conflicting accounts, reconstruct the timeline, and file a final report.

## Current state

Version **0.5.1** is a playable test build, not a Café Bazaar release. It includes:

- 16 pieces of evidence, 22 interview questions, three contradictions, five deductions, and three competing hypotheses that require both an interpretation and supporting evidence.
- Two report outcomes, retry without losing evidence, optional deduction hints, and an actionable next lead.
- Automatic per-case saves, backup recovery, and manual save export/import. Older saves without hypothesis progress remain readable.
- A portrait-first, right-to-left interface with locally bundled Vazirmatn fonts, case imagery, rain ambience, a quiet piano motif, and subtle button feedback. Audio can be turned off in settings.
- A case catalog and a boundary for future permanent case ownership. **No purchase flow is active.**

The story and interface are in Persian. The technical documents in `docs/` are also currently in Persian.

## Install on Android

Build `dist/Case47-0.5.1-test.apk` using the instructions below, or obtain that test APK separately from the project owner. The `dist/` directory and signing key are intentionally excluded from Git.

The APK requires **Android 8.0 (API 26) or newer**. Once installed, gameplay needs no internet connection. The app requests no internet, microphone, contacts, or personal-file permissions. Its test signing key is unsuitable for store publication.

Progress is stored on the device. Clearing app data or uninstalling the app removes that local save; export it from settings first if you need to keep it. Updating with the same application ID and signing key should preserve app data.

## Run and test the source

Requirements: Python 3 and Node.js 18 or newer. The game engine has no runtime npm dependencies.

```sh
python tools/build_web.py
python -m http.server 8080 --directory web
node --test tests/engine.test.cjs
```

Open `http://localhost:8080` to play in a browser. For browser tests, install the development dependency and provide a Chromium executable:

```sh
npm install
CHROMIUM_PATH=/usr/bin/chromium npm run test:ui
CHROMIUM_PATH=/usr/bin/chromium npm run test:resilience
```

`tools/build_web.py` also creates a self-contained `dist/case47-standalone.html`. Browser tests cover that file when served locally; opening it directly through `file://` has not been verified on the target phone.

To build the Android test APK, use Java 21 and the official Android SDK tools downloaded by the setup script:

```sh
python tools/setup_android.py
python tools/build_android.py
```

See [`docs/ANDROID.md`](docs/ANDROID.md) for signing and release considerations, [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the case format and engine, and [`docs/TEST-REPORT.md`](docs/TEST-REPORT.md) for test scope. **[`docs/WALKTHROUGH-SPOILERS.md`](docs/WALKTHROUGH-SPOILERS.md) reveals the case solution.**

## Verification and remaining work

Automated tests cover the full playable route, wrong and correct reports, save recovery, offline browser play, audio state, the new hypotheses, and layouts from 320 to 1280 pixels wide. The APK has been built and its manifest, alignment, and v2/v3 signatures checked. **Installation and play on a physical Android phone have not yet been verified.**

Before a store release, the owner still needs a final application ID, a release signing key, device testing, store assets and policy review. Café Bazaar in-app billing for future cases has not been connected or tested. The current APK uses a temporary application ID and test key.

## Recent changes

- **0.5.1:** Reconciled the camera footage with the timeline, required both witness contradictions before judging their lies, and slightly reduced the home-screen heading.

- **0.5.0:** Added evidence-backed competing hypotheses and optional button sounds; kept old saves readable.
- **0.4.0:** Rewrote the detective introduction for use across cases, kept interview answers in a readable record, and added next-lead navigation.
- **0.3.0:** Added the detective desk, case catalog and solved-case status, plus an app icon independent of Case 47.
- **0.2.0:** Added realistic scene, suspect, and evidence imagery, rainy-city visuals, piano/rain audio, and a chronology review.
