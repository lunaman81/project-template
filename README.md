# Project Template

A ready-to-go project scaffold for building with Claude Code. Clone it, open it, paste the starter prompt, and you're building.

## Setup

1. Clone this repo (or use it as a GitHub template)
2. Open the folder in Claude Code
3. Paste this as your first message:

```
My project is called [NAME]. It [one sentence about what it does]. Let's get started.
```

Claude reads the CLAUDE.md system file automatically, asks you two questions (outcome + constraints), restates the smallest problem to solve, and starts executing.

## What's Included

| File | Purpose |
|---|---|
| `CLAUDE.md` | Operating system for every session — build workflow, QA, push rules, session close protocol |
| `push-wrapper.js` | Enforced QA → changelog → version tag → commit → push pipeline |
| `run.js` | Entry point: `--code`, `--push`, `--live` modes (customize stubs for your project) |
| `CHANGELOG.md` | Auto-populated version log (managed by push-wrapper) |
| `session-log.md` | Session-level build log (managed by Claude per CLAUDE.md) |
| `learnings.md` | Session-level lessons learned (managed by Claude per CLAUDE.md) |
| `run.log` | Push success/failure log |

## Push Commands

```bash
node run.js --code "feat: add login page"    # Push code changes
node run.js --push                           # Batch data push (customize stub)
node run.js --live                           # Live integration push (customize stub)
```

No push goes through without: passing tests + QA report + P1s resolved + docs updated + changelog entry.
