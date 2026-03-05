# 🤝 Contributing to IDE Games

Thank you for your interest in contributing! This guide will help you get started quickly.

---

## 🚀 Development Setup

```bash
# Clone the repository
git clone https://github.com/berkesasa/ide-games.git
cd ide-games

# Open in VS Code
code .

# Press F5 → "Run Extension" → Extension Development Host opens
# Use the 🎮 button in the status bar to test
```

## 📁 Project Structure

```
ide-games/
├── extension.js        # Entry point — VS Code API + routing only
├── games/              # Each game in its own file
│   ├── game2048.js     # 🔢 2048
│   ├── runner.js       # 🏃 Runner
│   ├── codedust.js     # 🧹 Code Dust
│   ├── memory.js       # 🧠 Memory
│   └── flappybird.js   # 🐦 Flappy Bird (planned)
├── package.json
├── icon.png
└── README.md
```

## 🎮 Adding a New Game

1. Create `games/yourgame.js`:
   ```js
   function getYourGameHTML(nonce) {
       return `<!DOCTYPE html>...`;
   }
   module.exports = { getYourGameHTML };
   ```

2. Import it in `extension.js`:
   ```js
   const { getYourGameHTML } = require('./games/yourgame');
   ```

3. Add it to `showGamePicker()`:
   ```js
   { label: '🎯 Your Game', description: 'Short description', game: 'yourgame' }
   ```

4. Add it to the `titles` and `htmlMap` objects inside `createGamePanel()`.

## 🔧 Rules & Standards

- Each game **must live in its own `.js` file** — do not write game code directly in `extension.js`
- Game files must only export `module.exports = { getXxxHTML }` — no VS Code API usage inside game files
- Always maintain `Content-Security-Policy` in WebViews (use `nonce`)
- Every game must support `ESC` → close and `🎮 Change Game` → game picker
- Keep games CPU-friendly — avoid unnecessary `requestAnimationFrame` when idle

## 📬 Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-game-name`
3. Commit your changes: `git commit -m "feat: add Your Game"`
4. Push: `git push origin feat/your-game-name`
5. Open a Pull Request — include the game name, controls, and a screenshot in the description

## 🐛 Reporting Bugs

Open a [GitHub Issue](https://github.com/berkesasa/ide-games/issues) and include:
- VS Code / Cursor version
- Operating system
- Steps to reproduce
- Error message (if any)
