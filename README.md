# 🎮 IDE Games — VS Code Extension

> A collection of 5 mini-games to keep you entertained while AI is generating a response — or whenever you feel like playing.

---

## 🕹️ Games

| # | Game | Description | Status |
|---|------|-------------|--------|
| 1 | 🔢 **2048** | Classic 2048 — slide, merge, reach 2048 | ✅ Available |
| 2 | 🐸 **Crossy Road** | Cross the road without getting hit | 🔜 Planned |
| 3 | 🏃 **Runner** | Endless runner — jump over obstacles | ✅ Available |
| 4 | 🧹 **Code Dust** | Scratch-off mechanic — erase the dust to reveal a hidden scene | ✅ Available |
| 5 | 🧠 **Memory** | Match color pairs in as few moves as possible | ✅ Available |
| 6 | 🐦 **Flappy Bird** | Fly through pipes, don't fall! | 🔜 Planned |

---

## 📁 Project Structure

```
ide-games/
├── extension.js          # VS Code extension entry point (routing + VS Code API only)
├── games/
│   ├── runner.js         # 🏃 Runner — endless runner
│   ├── game2048.js       # 🔢 2048 — classic number merge
│   ├── crossyroad.js     # 🐸 Crossy Road — road crossing (planned)
│   ├── codedust.js       # 🧹 Code Dust — scratch-off canvas game
│   ├── memory.js         # 🧠 Memory — color pair matching
│   └── flappybird.js     # 🐦 Flappy Bird — pipe navigation (planned)
├── package.json
├── icon.png
├── README.md
└── CHANGELOG.md
```

> **Why is each game in a separate file?**
> - 🔍 **Easy debugging** — trace errors in the relevant game file, not a monolithic 800-line file
> - ♻️ **Reusability** — each game can be tested independently and included in `extension.js` via `require()`
> - 👥 **Team-friendly** — multiple contributors can work on different games without conflicts
> - 📦 **Scalability** — adding a new game means creating one file + 2 lines in `extension.js`

---

## 🚀 How to Use

### Opening Games
1. Click the **🎮 IDE Games** button in the status bar
2. Open the command palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) → `IDE Games: Open Games`
3. Type `@games` in the chat panel — the game picker opens while AI responds

### Controls

| Game | Controls |
|------|----------|
| **Runner** | `Space` or Click → Jump |
| **2048** | `↑ ↓ ← →` Arrow keys or `W A S D` → Slide \| Swipe on touch |
| **Crossy Road** | `↑ ↓ ← →` Arrow keys → Move |
| **Code Dust** | Mouse drag → Scratch (no click needed) |
| **Memory** | Click → Flip card |
| **Flappy Bird** | `Space` or Click → Flap |
| **All games** | `ESC` → Close \| `🎮 Change Game` → Game picker |

---

## 🛠️ Development

```bash
# Clone the repository
git clone https://github.com/berkesasa/ide-games.git
cd ide-games

# Open in VS Code
code .

# Press F5 → Opens Extension Development Host
# Use the 🎮 button in the status bar to test
```

### Adding a New Game

```js
// 1. Create games/yourgame.js
function getYourGameHTML(nonce) {
    return `<!DOCTYPE html>...`;
}
module.exports = { getYourGameHTML };

// 2. Import in extension.js
const { getYourGameHTML } = require('./games/yourgame');

// 3. Add to showGamePicker()
{ label: '🎯 Your Game', description: 'Short description', game: 'yourgame' }

// 4. Add to htmlMap and titles in createGamePanel()
```

### Code Dust — Technical Notes

Code Dust is a **scratch-off** game that adapts to your VS Code theme:

```js
// Top layer uses VS Code editor background color
const bgColor = getComputedStyle(document.body)
  .getPropertyValue('--vscode-editor-background');

// On mousemove, erase pixels to reveal the hidden scene below
ctx.globalCompositeOperation = 'destination-out';
ctx.arc(x, y, brushRadius, 0, Math.PI * 2);
ctx.fill();
```

---

## 🔧 Compatibility

- ✅ VS Code
- ✅ Cursor
- ✅ Windsurf

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute a new game or fix a bug.

---

## 📄 License

MIT © [berkesasa](https://github.com/berkesasa)
