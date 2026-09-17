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

A Board card is a single block the user can grab (`cursor: grab`, `grabbing` while pressed/dragging).

Required visible pieces:

- Name (one line, ellipsis, 15px/600)
- Status chip
- Type (hidden if empty): uppercase mono micro-label with an accent-tinted square marker
- Tags (up to two outlined mono chips, then `+N`)
- Time line with a clock icon if either `start_at` or `end_at` exists (wraps rather than truncating):
  - both: `start → end`
  - start only: `Starts {time}`
  - end only: `Due {time}`
  - rendered in the overdue status color when the task status is `overdue`
- Hover: slight lift, accent-tinted border, deeper shadow; active press settles back

**Done column extra lines** (omit on To Do / Doing), separated by a hairline, each with an icon:

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

Primary button: `Add task` or `Save`. Secondary: `Cancel`. Buttons are content-width and right-aligned, not a split 50/50 row.

Tags use a chip editor: type then Enter (or comma) to add; Backspace on an empty field removes the last chip; each chip has an accessible remove button. Legacy comma-pasted text still splits into chips.

Both datetime fields have an inline clear (×) button when populated. Focus rings on form fields are a 3px accent-tint ring rather than the global outline. Form errors use the danger color with an alert icon, never muted gray. The dialog shows an explicit close (×) button in addition to Cancel.

If the saved `start_at` is in the future, close the form and do **not** leave a phantom card in To Do. Toast: `Saved to Scheduled.`

Clicking a card opens the same form in edit mode, titled with the task name. Saving applies the time-rehoming rules in the product spec.

Datetime controls must expose date and time (hours and minutes). Seconds are not shown. Use the user’s local timezone. Do not store or display UTC in the UI.

Completion time and duration are **not** in this form. If `completed_at` is set, show them below the editable fields as read-only text. Hide them while the task is still on To Do, Doing, or Scheduled.

### Drag

- Pointer: grab the card body (not only a tiny handle).
- Keyboard v1: optional; if implemented, use space to pick up and arrows to move, Enter to drop, Escape to cancel.
- While dragging, the source card dims to 35% opacity, a lifted `DragOverlay` copy follows the pointer, and the hovered column shows an inset accent ring plus a tinted card region.
- Dropping on Done **opens the confirmation modal before commit**. The card stays in a pending preview on Done or snaps back on cancel; either is fine as long as cancel leaves no Done record.
- Dropping on To Do or Doing commits immediately.

Do not allow dropping onto nav items, Scheduled, or Archive.

## Scheduled

A single chronological list, soonest `start_at` first, presented inside a centered 820px column with a masthead (title, waiting count, Add task).

Tasks are grouped by local calendar day. Each sticky group header shows the localized weekday/month/day, a count, and — for the next two days — a relative badge: solid `Today`, soft `Tomorrow`. No badge for later days.

Each row uses the same compact card as the Board: name, type, tags, start time, end time if any, status `Will do`, and the same open / Archive now actions.

Empty state is a centered icon, the copy `No scheduled tasks. Set a future start time when you add a task.`, and an inline Add task button.

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

Filters live in a single surface card: search (name, with leading search icon), status, type, tag, archived-from, archived-to, and a Clear filters action that only appears while a filter is active.

A result line above the table reports `{count} archived tasks`, or `{shown} of {total}` while filtering. Table headers are uppercase mono micro-labels; rows highlight on hover; timestamp columns use the mono font.

Delete is a quiet icon-plus-label action that sits at reduced opacity until its row is hovered (or it receives keyboard focus). It always opens the delete confirmation. There is no drag on this page.

Empty copy: `Archive is empty.` (archive icon). When filters exclude everything: `No archived tasks match these filters.` with a prominent Clear filters button.

v1 has no “restore” action.

## Settings

Grouped sections rendered as individual surface cards with accent-bar headings, not a kitchen-sink grid:

1. **Archive** — numeric input `Archive completed tasks after (days)` with helper text explaining that `0` archives on the next check after completion.
2. **Appearance** — theme picker (five named preview swatches; the active swatch gets an accent ring and a check badge), color scheme (`Light`, `Dark`, `Match system`) as a segmented control, and a custom-styled font-size slider (`12`–`18` px, default `13`) with a mono readout. Changing font size scales UI type and control heights immediately.
3. **Language** — `English`, `简体中文` in a segmented control. Changing language updates UI chrome immediately; it does not translate user task names.
4. **Task types** — list with rename and delete; add field for a new type name. Rename is disabled until the draft differs from the current name; Delete is disabled when the type is referenced.

All picker buttons expose `aria-pressed`.

## Dialogs

All confirmations are modal, focus-trapped, dismissible via Cancel, Escape, the overlay, and an explicit × button in the panel corner. The overlay fades in; the panel rises (fade + slight scale/translate). Confirm buttons are explicit (`Move to Done`, `Archive now`, `Delete`). The Done and Archive confirms are not color-danger. Delete confirm uses the theme’s danger color.

Do not auto-dismiss these dialogs on a timer.

## App chrome

The title bar groups an accent-colored brand mark (monogram) with the wordmark, then the top nav. The active nav item exposes `aria-current="page"`; each theme styles it differently (inset accent rule on Metal, pill on Claude/TikTok, bottom rule on VS Code/GitHub). Column headers carry a count badge, also theme-shaped.

Toasts slide up from the bottom-right with a check icon and an accent left rule.

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

- **Loading** (first paint while SQLite opens): a short unlabeled pill pulse in the page body is enough. Do not invent a marketing splash.
- **Board empty columns**: centered circular icon + the empty copy; the empty To Do column also contains a dashed Add task button, so the primary action is never hidden.
- **Storage error**: centered card with a danger-tinted alert icon, the data path in mono, and a solid danger `Quit` button.
- **No results** in Archive filters: search icon + `No archived tasks match these filters.` plus a clear-filters button.

## Accessibility baseline

- Text contrast meets WCAG 2.2 AA against the theme surface behind it.
- Icon-only controls have accessible names.
- Dialogs return focus to the card that opened them.
- Hit targets for add, nav, and card menus are at least 32 px.

Motion stays modest: dialog/menu/toast fade-and-rise, card hover lift, drag overlay. Everything is wrapped in a global `prefers-reduced-motion: reduce` override that collapses durations to ~0. No celebration confetti on Done.

## What the first implementation should match

If a visual decision is not in [theming.md](theming.md), prefer:

- Cards as solid surfaces with a short shadow or border (theme-specific), not glassmorphism on every theme
- Comfortable type: name 15–16 px, meta 12–13 px
- Column headers that look like labels, not another card
- Plenty of vertical rhythm so overdue chips do not collide with tags
