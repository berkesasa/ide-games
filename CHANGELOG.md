# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.0.0] — 2026-03-06

### Added
- **🔢 2048** — classic number merge game with dark premium UI, tile animations, best score, swipe support, WASD controls
- **🏃 Runner** — endless runner with jump mechanics, obstacles, and particle effects
- **🧹 Code Dust** — scratch-off canvas game using `destination-out` technique and nebula background
- **🧠 Memory** — color pair matching game
- **`games/` modular architecture** — each game lives in its own file (`games/*.js`)
- `extension.js` acts as routing-only entry point (~134 lines)
- Status bar button (`🎮 IDE Games`)
- `ESC` to close any game
- `🎮 Change Game` button in all games
- `@games` chat participant — game picker opens while AI responds
- `ViewColumn.One` — games open without splitting the editor
- Open-source essentials: `LICENSE` (MIT), `.gitignore`, `CONTRIBUTING.md`, `CHANGELOG.md`
- `package.json` enriched with `repository`, `homepage`, `bugs`, and `keywords`
