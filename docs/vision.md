# Vision

Yuli Todo is a single-user Windows desktop app for moving personal work through a three-column board: **To Do**, **Doing**, and **Done**.

It is local-first. There is no account, no cloud, and no network requirement. The owner should be able to capture a task in seconds, see what is in flight, finish it with an explicit confirmation, and later find it in an archive.

## License

MIT. Copyright (c) 2026 MrY. See [LICENSE](../LICENSE).

## Goals

- Make the daily path obvious: scheduled work waits off the board, active work sits on the board, finished work parks in Done, then archives.
- Keep **column** (where the card sits) separate from **status** (how the work is going). Overdue work can stay in To Do or Doing.
- Prefer confirmation over silent destruction: entering Done, force-ending, and deleting all require a dialog.
- Stay usable without the internet, forever, on one Windows machine.
- Look like a designed product, not a generic admin template: five named themes, each with light and dark.

## Non-goals (v1)

These are explicitly out of scope until a later, separate decision:

- Accounts, login, passwords, or multi-user sharing
- Cloud sync, Git backup as a product feature, or any required network call
- Mobile, macOS, or Linux packaging
- Collaboration, comments, @mentions, or activity feeds
- Plugins, theme marketplaces, or user-authored CSS
- Habit tracking, four-quadrant matrices, or calendar-as-primary-UI
- Recurring task rules
- Restoring a card from the archive back onto the board
- Dragging a card from the board onto Scheduled (time edits may rehome a task; drag does not)
- AI task splitting or natural-language inbox parsing

## Design principles

1. **Board for now, Scheduled for later, Archive for history.** The three-column board never lists `will_do` or archived tasks.
2. **Start time gates appearance.** Empty start time means “already eligible.” A future start time means Scheduled.
3. **End time gates honesty.** Missing end time means the task never becomes overdue. A reached end time on the board becomes `overdue` without moving the card.
4. **Done is a decision.** Dropping into the Done column always asks. Overdue completions become `belated`; on-time completions become `done`.
5. **Delete is rare.** Active tasks cannot be deleted. Wrong or abandoned work is force-ended into the archive. Only archived rows can be destroyed.
6. **English is native.** Code, docs, and source strings are English. Chinese is a first-class translation, not a fork of the product.

## Glossary

| Term | Meaning |
| --- | --- |
| Board | The main page with three columns: To Do, Doing, Done |
| Column | Board placement: `todo`, `doing`, or `done` |
| Status | Lifecycle flag such as `to_do`, `overdue`, or `belated` |
| Scheduled | Page that lists `will_do` tasks whose `start_at` is still in the future |
| Archive | Page of tasks that have left the board permanently (for v1) |
| Task type | User-defined **single-select** category |
| Tag | Free-form **multi-select** label |
| Content | Primary description of the work |
| Notes | Extra remarks, secondary to content |
| `start_at` / `end_at` | Optional local timestamps at minute precision |
| Completion time | System `completed_at`: when the task entered Done or was force-ended. Read-only. Shown on Done cards and Archive |
| Duration | Wall time spent in the **Doing** column (`doing_elapsed_seconds`). Pauses on To Do. Direct To Do → Done with no Doing time is `0`. Read-only. Shown on Done cards and Archive |
| Archive delay | Days after completion before `done` / `belated` auto-archive (default 3) |
| Archive now | Context-menu action that archives immediately after confirm |
| Force ended | Status `force_ended` used when an incomplete task is archived now |
| Theme id | One of `metal`, `claude`, `vscode`, `github`, `tiktok` |

Identifiers in this glossary are stable. UI labels may be translated; identifiers must not.
