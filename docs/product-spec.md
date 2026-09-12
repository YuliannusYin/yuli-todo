# Product specification

This document defines user-visible behavior for Yuli Todo v1. Storage details live in [data-model.md](data-model.md). Screen layout lives in [ux-spec.md](ux-spec.md).

## Surfaces

The app has four primary pages:

| Page | Shows | Purpose |
| --- | --- | --- |
| Board | Non-archived tasks in columns To Do, Doing, Done | Daily work |
| Scheduled | Non-archived tasks with status `will_do` | Work that must not appear yet |
| Archive | Tasks with `archived_at` set | History and deletion |
| Settings | App preferences and type list | Archive delay, language, theme, types |

There is no login screen and no network error screen.

## Task fields

| Field | Required | Notes |
| --- | --- | --- |
| Name | Yes | Single line. Trimmed. Empty name is rejected. |
| Type | No | User-defined single-select. Empty is allowed. |
| Content | No | Main description. Multiline plain text. |
| Tags | No | Zero or more free-form labels. |
| Notes | No | Secondary remarks. Multiline plain text. |
| Start time (`start_at`) | No | Local `YYYY-MM-DD HH:mm`. Minute precision. |
| End time (`end_at`) | No | Same precision. If both times are set, `end_at` must be greater than or equal to `start_at`. |
| Completion time (`completed_at`) | System | Set when confirming Done or Archive now. Cleared if the card is dragged out of Done before archive. **Read-only** in the UI. |
| Duration | System | Wall time spent in the Doing column. See [Completion time and duration](#completion-time-and-duration). **Read-only**. |
| Status | Yes | System-owned. Users change it through drag, time, or Archive now — not by picking a status dropdown as the primary control. |
| Column | Conditional | `todo` / `doing` / `done` while the task is on the Board. Null on Scheduled. Last board column is retained after archive for history. |

Content is the body of the task. Notes are extra remarks and must not be treated as a second title.

## Type versus tags

- **Type** is one user-defined category per task (for example `Work`, `Life`, `Study`). Users create and rename types in Settings. A type in use by any task, including archived tasks, cannot be deleted until those tasks are retargeted or deleted.
- **Tags** are many free-form strings per task. Typing a new tag in the editor creates it. Tags are matched case-insensitively for autocomplete; the first casing the user saved is the display form.

A seeded type named `General` may exist on first launch so the picker is not empty. It is a normal type and can be renamed or deleted under the same rules.

## Where a new task goes

Tasks are created from the Board To Do column (primary) or from Scheduled.

| `start_at` at save time | Destination | Status | Column |
| --- | --- | --- | --- |
| Empty, or less than or equal to now | Board, To Do | `to_do`, or `overdue` if `end_at` is already due | `todo` |
| After now | Scheduled | `will_do` | none |

Creating from Scheduled with an empty or already-due `start_at` must land on the Board To Do column, not on Scheduled.

If `start_at` is in the future and `end_at` is in the past, validation fails (`end_at` would be before `start_at`).

## Board columns

| Column UI name | Column id | Typical statuses |
| --- | --- | --- |
| To Do | `todo` | `to_do`, `overdue` |
| Doing | `doing` | `doing`, `overdue` |
| Done | `done` | `done`, `belated` |

Rules:

- `will_do` never appears on the Board.
- Archived tasks never appear on the Board or Scheduled.
- `overdue` does **not** get its own column. The card stays where it was when the end time fired.
- Compact cards on To Do and Doing show: name, type, tags, start/end (if set), and status. Content and notes open in the detail view.
- Compact cards on **Done** also show **completion time** and **duration** (including `0` duration). They do not show a live timer.

## Drag and drop

Before archive, a card may move freely among the three Board columns.

| From | To | Confirm? | Resulting status |
| --- | --- | --- | --- |
| To Do | Doing | No | `doing`, unless current status is `overdue` (stays `overdue`). Start a Doing time session. |
| Doing | To Do | No | `to_do`, unless current status is `overdue` (stays `overdue`). Pause duration (flush the open session). |
| To Do or Doing | Done | **Yes** | `overdue` → `belated`; otherwise → `done`. Set `completed_at` to now. Flush any open Doing session into duration first. |
| Done | To Do | No | `overdue` if `end_at` is due, else `to_do`. Clear `completed_at`. Keep accumulated duration; do not run the Doing timer. |
| Done | Doing | No | `overdue` if `end_at` is due, else `doing`. Clear `completed_at`. Keep accumulated duration and start a new Doing session. |

If the user cancels the Done confirmation, the card returns to the source column and nothing is persisted.

There is no drag from Board to Scheduled or from Archive to anywhere. Cross-page rehoming happens only through time edits or Archive now.

## Completion time and duration

These two values are **system-owned**. The create/edit form never lets the user type them. Detail view shows them only when `completed_at` is set (Done column, or Archive including `force_ended`).

### Completion time

`completed_at` is the local-display timestamp of the moment the user confirmed **Move to Done** or **Archive now**.

- Dragging out of Done before archive **clears** `completed_at`. The next completion writes a new stamp.
- Auto-archive does not change `completed_at`.
- `force_ended` still gets a completion time (the force-end moment).

### Duration

Duration is **wall-clock time the card sat in the Doing column**, including overnight and while the app was closed. It is **not** time since `start_at` or `created_at`.

| Situation | Effect on duration |
| --- | --- |
| Enter Doing (from To Do, from Done, or overdue staying on Doing) | Start an open session (`doing_started_at = now`) if none is open |
| Leave Doing for To Do | Add the open session to the accumulator, then pause |
| Confirm Done from Doing | Flush the open session, then freeze |
| Confirm Done from To Do, and the card never sat in Doing | Duration is `0` |
| Confirm Done from To Do after earlier Doing work | Duration is the paused accumulator (not reset to `0`) |
| Archive now from Doing | Flush, then freeze (same as completing) |
| Archive now from Scheduled / To Do | Freeze whatever was already accumulated (`0` if never in Doing) |
| Overdue while the card stays in Doing | Timer keeps running; overdue is not a pause |
| Drag Done → To Do | Keep accumulator; do not start a session |
| Drag Done → Doing | Keep accumulator; start a new session |

Displayed duration uses the frozen accumulator after a flush. To Do and Doing compact cards do **not** show a live timer in v1.

Zero is a real value: show `0m` / `0分`, do not hide the row.

### Where they appear

- **Done column** compact cards: completion time + duration
- **Archive** rows: completion time + duration (all archived statuses, including `force_ended`)
- **Detail** of those tasks: the same two fields, read-only
- To Do, Doing, and Scheduled lists: omit both fields

## Time-driven status

The app evaluates times on launch and at least once per minute while running.

### Start time reached

When a `will_do` task has `start_at <= now`:

1. Move it to Board column `todo`.
2. Set status to `to_do`.
3. In the **same** pass, if `end_at` is set and `end_at <= now`, set status to `overdue` instead.

### End time reached

When a Board task in column `todo` or `doing` has `end_at <= now` and status is not already `overdue`, `done`, or `belated`:

- Set status to `overdue`.
- Do not change column.

Empty `end_at` means the task never becomes overdue.

Tasks in Done are never flipped to `overdue`. Their lateness is already recorded as `done` versus `belated`.

### Editing times

Saving the detail form reapplies placement rules:

| Change | Effect |
| --- | --- |
| Set `start_at` to the future on a non-archived task | Leave the Board (or stay off it). Status becomes `will_do`. Column cleared. Flush any open Doing session; keep accumulated duration. |
| Clear `start_at` or set it to now/past on `will_do` | Move to Board To Do as `to_do`, then apply overdue check. |
| Clear `end_at`, or move `end_at` into the future, while status is `overdue` | Status becomes `to_do` or `doing` according to the current column. |
| Set `end_at` to now/past on a Board To Do / Doing card | Status becomes `overdue`. |

Archived tasks may still be viewed; v1 does not require editing them. If editing archived tasks is implemented later, it must not un-archive them.

## Archive

### Automatic

Statuses `done` and `belated` archive when:

```
now >= completed_at + archive_after_days
```

`archive_after_days` defaults to **3**, is an integer, lives in Settings, and is stored in whole days. Allowed range: **0–365**. `0` means the task archives on the next scheduler pass after completion (within about one minute).

Automatic archive does not change `done` or `belated`. It sets `archived_at` to now and removes the card from the Board.

### Archive now (context menu)

Available on Board and Scheduled for any non-archived task. Always requires confirmation.

| Current status | After confirm |
| --- | --- |
| `will_do`, `to_do`, `doing`, `overdue` | Status `force_ended`. `archived_at` = now. `completed_at` = now. Flush any open Doing session first. |
| `done`, `belated` | Status unchanged. `archived_at` = now. `completed_at` and duration kept. |

Archive now is the supported way to abandon work that should never be completed.

### Archive page

The Archive page lists **archived tasks only**. It is not a dump of active work.

Each row shows completion time and duration (including `force_ended` and including `0` duration).

Users can filter by status (`done`, `belated`, `force_ended`), type, tag, and archived date range, and can search by name.

v1 does not restore archived tasks to the Board.

## Delete

- Delete exists **only** on the Archive page.
- Delete always opens a confirmation dialog naming the task.
- Confirm permanently removes the task row and its tag links. This cannot be undone in-app.
- Board, Scheduled, and detail views on active tasks have no delete control.

## Settings

| Setting | Values | Default |
| --- | --- | --- |
| Archive after | Integer days, 0–365 | 3 |
| Language | `en`, `zh-CN` | `en` |
| Theme | `metal`, `claude`, `vscode`, `github`, `tiktok` | `metal` |
| Color scheme | `light`, `dark`, `system` | `system` |
| Task types | Create, rename, delete-if-unused | Seeded `General` |

Changing archive delay is not retroactive in a surprising way: the scheduler always computes `completed_at + current delay`. Shortening the delay may archive already-completed cards on the next pass. Lengthening it can keep them on Done longer.

## Context menu (active tasks)

Right-click (and the equivalent keyboard menu key when the card is focused) on a Board or Scheduled card:

- Open details
- Archive now…

No delete item on this menu.

## Confirmation copy (English source)

Done drop:

- Title: `Move to Done?`
- Body: `This marks the task finished. Overdue tasks become Belated.`
- Confirm: `Move to Done`
- Cancel: `Cancel`

Archive now (incomplete):

- Title: `Archive this task?`
- Body: `This force-ends the task and moves it to Archive. You can delete it later from Archive.`
- Confirm: `Archive now`
- Cancel: `Cancel`

Archive now (already `done` / `belated`):

- Title: `Archive this task?`
- Body: `This hides the task from the board immediately. Status stays as it is.`
- Confirm: `Archive now`
- Cancel: `Cancel`

Delete:

- Title: `Delete this task?`
- Body: `This cannot be undone.`
- Confirm: `Delete`
- Cancel: `Cancel`

Chinese strings are specified in [i18n.md](i18n.md).

## Notifications and OS chrome

v1 does not require tray, global hotkeys, or OS notifications. Those may appear after v1 without changing the rules in this spec.

## Failure and edge behavior

- If the database file cannot be opened, show a blocking English/Chinese error (per current language) with the file path. Do not silently start empty.
- Scheduler misses while the app is closed are caught on next launch (promote `will_do`, mark `overdue`, auto-archive).
- Duplicate tags on one task are collapsed.
- Names longer than 200 characters are rejected. Content and notes may be long; implementation may cap them (recommended 20,000 characters each) and must document the cap in the UI if hit.
