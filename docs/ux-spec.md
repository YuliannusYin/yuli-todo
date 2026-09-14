# UX specification

Visual tokens come from [theming.md](theming.md). Behavior comes from [product-spec.md](product-spec.md). This document specifies structure, density, and interaction.

## App shell

The window is a standard desktop frame (not a tiny overlay). Minimum useful size: **880 × 580**. Default size is **1024 × 680**. Below the minimum, columns may scroll internally; the shell must not collapse to a single column.

```
+---------------------------------------------------------------+
|  Yuli Todo     Board  Scheduled  Archive  Settings    _ □ ×   |
+---------------------------------------------------------------+
|                                                               |
|                         Page body                             |
|                                                               |
+---------------------------------------------------------------+
```

v1 uses a **top nav** of four destinations rather than a dense sidebar. The active route is visually obvious (underline or filled chip, theme-dependent).

The OS title bar is hidden. Minimize, maximize/restore, and close live in the same top chrome as the product name and nav, themed with `--yl-*` tokens. The brand and the empty stretch of the bar are drag regions (including double-click to maximize). Loading and storage-error states show the same chrome so the window can still be moved or closed.

## Board

Three equal-width columns with a small gutter. Column order is fixed: To Do, Doing, Done.

Each column:

1. Sticky header with the English column name (translated when `zh-CN` is active) and a count of cards in that column.
2. Vertical scroll region of cards.
3. **To Do only:** a footer control `Add task` that opens the create form.

Empty columns still show the header and, in To Do, the add control. Empty body copy:

- To Do: `Nothing to do. Add a task.`
- Doing: `Nothing in progress.`
- Done: `Nothing finished yet.`

Cards stack top-to-bottom in a stable order: last updated descending is acceptable for v1; do not reshuffle under the pointer during drag.

### Compact card

A Board card is a single block the user can grab.

Required visible pieces:

- Name (one line, ellipsis)
- Status chip
- Type (hidden if empty)
- Tags (up to two chips, then `+N`)
- Time line if either `start_at` or `end_at` exists:
  - both: `start → end`
  - start only: `Starts {time}`
  - end only: `Due {time}`

**Done column extra lines** (omit on To Do / Doing):

- `Completed {completed_at}` using the same local datetime format as start/end
- `Duration {formatted duration}` even when the value is zero

Duration strings follow [i18n.md](i18n.md) (minute precision, `0m` / `0分` for under one minute).

Content and notes are **not** on the compact card.

`overdue` and `belated` chips must remain readable in both color schemes (see theming status colors). Do not rely on color alone: the chip includes the status word.

### Create / edit

**Add task** opens a **modal** (the same custom dialog shell as confirmations, larger). Do not use a side drawer in v1. Fields:

- Name
- Type (select with an inline “new type” action)
- Content
- Tags
- Notes
- Start time (date + time, clearable)
- End time (date + time, clearable)

Primary button: `Add task` or `Save`. Secondary: `Cancel`.

If the saved `start_at` is in the future, close the form and do **not** leave a phantom card in To Do. Optional toast: `Saved to Scheduled.`

Clicking a card opens the same form in edit mode, titled with the task name. Saving applies the time-rehoming rules in the product spec.

Datetime controls must expose date and time (hours and minutes). Seconds are not shown. Use the user’s local timezone. Do not store or display UTC in the UI.

Completion time and duration are **not** in this form. If `completed_at` is set, show them below the editable fields as read-only text. Hide them while the task is still on To Do, Doing, or Scheduled.

### Drag

- Pointer: grab the card body (not only a tiny handle).
- Keyboard v1: optional; if implemented, use space to pick up and arrows to move, Enter to drop, Escape to cancel.
- While dragging, column drop targets highlight.
- Dropping on Done **opens the confirmation modal before commit**. The card stays in a pending preview on Done or snaps back on cancel; either is fine as long as cancel leaves no Done record.
- Dropping on To Do or Doing commits immediately.

Do not allow dropping onto nav items, Scheduled, or Archive.

## Scheduled

A single chronological list, soonest `start_at` first.

Each row: name, type, tags, start time, end time if any, status `Will do`, and the same open / Archive now actions as the Board.

Empty copy: `No scheduled tasks. Set a future start time when you add a task.`

There is no three-column layout on this page. There is an `Add task` control; the same form is used. If the user leaves start time empty, the task appears on the Board instead.

## Archive

A filterable table or dense list. Columns / fields:

- Name
- Status (`done`, `belated`, `force_ended`)
- Type
- Tags
- Completed (`completed_at`)
- Duration (formatted Doing elapsed time, including `0`)
- Archived
- Actions: Delete

Filters: search (name), status, type, tag, archived-from, archived-to.

Empty copy: `Archive is empty.`

Delete is an explicit button or row menu. It always opens the delete confirmation. There is no drag on this page.

v1 has no “restore” action.

## Settings

Grouped sections, not a kitchen-sink grid:

1. **Archive** — numeric input `Archive completed tasks after (days)` with helper text explaining that `0` archives on the next check after completion.
2. **Appearance** — theme picker (five named preview swatches), color scheme (`Light`, `Dark`, `Match system`), and a font-size slider (`12`–`18` px, default `13`). Changing font size scales UI type and control heights immediately.
3. **Language** — `English`, `简体中文`. Changing language updates UI chrome immediately; it does not translate user task names.
4. **Task types** — list with rename and delete; add field for a new type name. Delete is disabled when the type is referenced.

## Dialogs

All confirmations are modal, focus-trapped, dismissible via Cancel, Escape, and the overlay. Confirm buttons are explicit (`Move to Done`, `Archive now`, `Delete`). The Done and Archive confirms are not color-danger. Delete confirm uses the theme’s danger color.

Do not auto-dismiss these dialogs on a timer.

## Context menu

Right-click on a Board or Scheduled card:

- `Open details`
- `Archive now…`

The ellipsis on Archive now indicates a follow-up dialog. Disabled states are not required; the menu is only offered on active tasks.

## Status chips

| Status | Tone |
| --- | --- |
| `will_do` | Neutral / muted |
| `to_do` | Neutral |
| `doing` | Accent / in-progress |
| `done` | Positive |
| `overdue` | Warning |
| `belated` | Warning-positive (finished late) |
| `force_ended` | Neutral-danger (closed without finishing) |

Chip text is the localized status label from [i18n.md](i18n.md).

## Empty, loading, and error

- **Loading** (first paint while SQLite opens): a short unlabeled pulse in the page body is enough. Do not invent a marketing splash.
- **Storage error**: full-page message with the data path and `Quit`.
- **No results** in Archive filters: `No archived tasks match these filters.` plus a clear-filters action.

## Accessibility baseline

- Text contrast meets WCAG 2.2 AA against the theme surface behind it.
- Icon-only controls have accessible names.
- Dialogs return focus to the card that opened them.
- Hit targets for add, nav, and card menus are at least 32 px.

Motion stays modest: drag preview and dialog fade. No celebration confetti on Done.

## What the first implementation should match

If a visual decision is not in [theming.md](theming.md), prefer:

- Cards as solid surfaces with a short shadow or border (theme-specific), not glassmorphism on every theme
- Comfortable type: name 15–16 px, meta 12–13 px
- Column headers that look like labels, not another card
- Plenty of vertical rhythm so overdue chips do not collide with tags
