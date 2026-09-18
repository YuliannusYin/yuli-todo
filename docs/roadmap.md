# Roadmap

Yuli Todo versions below `v1.0.0` are design and pre-release. **v1** is the first version of the Windows app that fully implements the documents in this folder.

Commit messages follow the repository Git rule: `v<major>.<minor>.<patch>` with typed bullet lines.

## v1 definition

v1 is done when all of the following are true on Windows, offline:

- Board with To Do / Doing / Done, add from To Do, compact cards, detail form
- Free drag among the three columns; **confirm** on entering Done; cancel restores the source column
- Status rules: `will_do`, `to_do`, `doing`, `done`, `overdue`, `belated`, `force_ended` as in [product-spec.md](product-spec.md) and [data-model.md](data-model.md)
- Scheduled page for future `start_at`; promotion on the clock tick
- Overdue on the board without changing column; Done maps overdue → belated
- Archive delay (default 3 days, 0–365), Archive now, Archive page, delete only in Archive with confirm
- User-defined types, free-form tags, optional start/end at minute precision
- Completion time and Doing-only duration on Done cards and Archive (read-only, including `force_ended` and `0`)
- Reports page: week/month/year/custom completions and Doing duration, type/tag splits, current board backlog
- Five themes × light/dark, plus Match system
- UI language English and Simplified Chinese
- SQLite in app data, no login, no network capability

Out of v1 (see [vision.md](vision.md) non-goals): restore from archive, recurrence, sync, non-Windows packages, tray/hotkeys.

## Version line

### v0.0.0 — Repository and design

First commit. Design-only; no application source.

- MIT license (Copyright 2026 MrY)
- English design docs (product, data, UX, theming, architecture, i18n, vision)
- Repository files: root README, `.gitignore`, `.gitattributes`, Git message rule

### v0.1.0 — Shell

- Tauri 2 + React + TypeScript + Vite scaffold (CSS Modules, no Tailwind)
- Four views (Board / Scheduled / Archive / Settings), English/Chinese chrome, theme tokens applied to an empty Board
- Settings persist theme, scheme, locale (SQLite or a stub that the next version replaces)

### v0.2.0 — Tasks without time engine

- Schema from [data-model.md](data-model.md)
- Create, edit, list on Board and Scheduled
- Types and tags
- Placement by `start_at` at save time

### v0.3.0 — Motion and confirmations

- Drag between columns
- Done confirmation
- Archive now + force ended
- Reverse drag from Done

### v0.4.0 — Clock and archive

- Startup + 60s tick: promote, overdue, auto-archive
- Archive page, filters, delete confirmation
- Archive delay setting

### v0.5.0 — Theme and copy complete

- All five themes, light and dark, system scheme
- Remaining i18n keys, empty states, error page
- Transition unit tests

### v0.6.0 — Reports

- Fifth top-nav page: Reports
- Period presets this week (Monday start) / this month / this year / custom
- Completions and Doing duration from `completed_at` (Done on the board and archive, including `force_ended`)
- Type and tag breakdown tables; custom SVG trend and type comparison charts with axes
- Live board backlog (To Do / Doing / Overdue) independent of the period
- Spec updates for five screens; no new IPC or schema

### v1.0.0 — Windows personal release

- v1 definition checklist above
- Annotated tag per repository Git rules

Minor bumps after v1 may add tray, backup export, or restore-from-archive without breaking the v1 rules unless a spec revision says so.

## Document versus code

Until v0.1.0 exists, **these Markdown files win**. After implementation starts, behavior bugs are fixed in code to match docs, unless a spec change is agreed and the docs are updated in the same change.

## Suggested next implementation slice

**v1.0.0:** Windows personal release of the v1 definition checklist.
