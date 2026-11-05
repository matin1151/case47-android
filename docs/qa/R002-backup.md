# R002 backup and isolated tests

Baseline source: 04e4f8e56ee68a3138319f392573812d6b5d649d.
Durable GitHub recovery branch: backup/room-six-before-r155.
Local full-history bundle: revision-backups/room-six-baseline.bundle.

2026-11-05: git bundle verify passed. A default clone did not select the remote-named ref; explicit fetch refs/remotes/origin/codex/room-six:refs/heads/restore succeeded. Checked out baseline in a separate restore-check directory and rebuilt HTML. Restored SHA256: 354e80ae7ef0bf88c9326d7a585f923f98b077e5e58cf801dc94a798be56ee9a, identical to delivered baseline.

Work happens in kavian-revision, leaving original working directory intact. Browser tests use new Playwright contexts, never a user's browser profile. Node tests use in-memory saves. Original HTML files are preserved. Baseline npm test: 45 passed, zero failed. Player-device storage has not been accessed or cleared.
