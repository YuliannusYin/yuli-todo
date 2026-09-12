# Yuli Todo

A personal, offline Windows kanban. Three columns — **To Do**, **Doing**, **Done** — plus Scheduled and Archive. No account. No network.

**Version:** `v0.5.0`  
**Status:** pre-release Windows app through Roadmap v0.5.0 — themes, i18n, clock, archive, and transition tests.

## License

[MIT](LICENSE) © 2026 MrY

## Development

Requires Node LTS, Rust stable, and Windows with WebView2.

```
npm install
npm run tauri dev
```

## Documentation

Read in this order:

1. [docs/README.md](docs/README.md) — document map
2. [docs/vision.md](docs/vision.md) — goals and glossary
3. [docs/product-spec.md](docs/product-spec.md) — behavior
4. [docs/architecture.md](docs/architecture.md) — locked stack
5. [docs/roadmap.md](docs/roadmap.md) — path to v1

The product language is English. Simplified Chinese is a UI translation, specified in [docs/i18n.md](docs/i18n.md).

## Locked stack

Tauri 2, React, TypeScript, Vite, CSS Modules, SQLite via `rusqlite` in Rust. Windows x64 only. Details: [docs/architecture.md](docs/architecture.md).

## Repository layout

```
LICENSE
README.md
docs/           English design specs
locales/        en and zh-CN UI catalogs
src/            React + CSS Modules + token CSS
src-tauri/      Rust commands and SQLite
.cursor/rules/  Git message format
```
