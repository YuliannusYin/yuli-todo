# Yuli Todo design docs

Yuli Todo is a personal, offline Windows kanban for tasks. These documents are the source of truth for product behavior, data, interface, theming, and architecture.

The application now lives in the repository root (`src/`, `src-tauri/`, `locales/`). After implementation started, behavior bugs are fixed in code to match these documents unless a spec change is agreed and updated in the same commit (see [roadmap.md](roadmap.md)). The project is licensed under [MIT](../LICENSE).

## Language

- Design docs, code identifiers, and default UI copy are **English**.
- Simplified Chinese (`zh-CN`) is a translated UI language, specified in [i18n.md](i18n.md).
- Do not translate identifiers (`will_do`, `metal`, `start_at`, and so on).

## Reading order

1. [vision.md](vision.md) — why the app exists, goals, non-goals, glossary
2. [product-spec.md](product-spec.md) — pages, fields, workflow rules
3. [data-model.md](data-model.md) — entities, status machine, persistence rules
4. [ux-spec.md](ux-spec.md) — layout, cards, dialogs, empty states
5. [theming.md](theming.md) — five built-in themes, light and dark
6. [architecture.md](architecture.md) — locked stack, Tauri, SQLite, offline constraints
7. [i18n.md](i18n.md) — locale policy and status label table
8. [roadmap.md](roadmap.md) — versions from this design freeze to v1

## Document map

| Document | What it decides |
| --- | --- |
| [vision.md](vision.md) | Product intent and glossary |
| [product-spec.md](product-spec.md) | User-visible behavior |
| [data-model.md](data-model.md) | Stored shape and transitions |
| [ux-spec.md](ux-spec.md) | Screens and interactions |
| [theming.md](theming.md) | Visual systems |
| [architecture.md](architecture.md) | Locked stack and runtime |
| [i18n.md](i18n.md) | English source, Chinese UI |
| [roadmap.md](roadmap.md) | What “v1” means |

## Status labels (quick reference)

| Identifier | English UI | Chinese UI |
| --- | --- | --- |
| `will_do` | Will do | 待开始 |
| `to_do` | To do | 待办 |
| `doing` | Doing | 进行中 |
| `done` | Done | 完成 |
| `overdue` | Overdue | 超时 |
| `belated` | Belated | 补做 |
| `force_ended` | Force ended | 强制结束 |

Full locale policy lives in [i18n.md](i18n.md).
