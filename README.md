# 🎮 IDE Games — VS Code Extension

> AI bir cevap üretirken (veya istediğiniz her an) sizi eğlendirecek 5 adetlik mini oyun koleksiyonu.

---

## 🕹️ Oyunlar

| # | Oyun | Açıklama | Durum |
|---|------|-----------|-------|
| 1 | 🔢 **2048** | Klasik 2048 — kaydır, birleştir, 2048'e ulaş | 🚧 Yapılıyor |
| 2 | 🐸 **Crossy Road** | Popüler karşıdan karşıya geçme oyunu | 🔜 Planlıyor |
| 3 | 🏃 **Runner** | Sonsuz koşucu — zıpla, engellerden kaç | ✅ Mevcut (iyileştirilecek) |
| 4 | 🧹 **Code Dust** | Kazı-Kazan mekaniği — VS Code arka plan rengiyle kaplı ekranı fare hareketiyle silerek gizli görseli ortaya çıkar (`destination-out` canvas tekniği) | 🔄 Yeniden tasarlanıyor |
| 5 | 🧠 **Memory Game** | Renk çiftlerini eşleştir, en az hamlede tamamla | ✅ Mevcut (iyileştirilecek) |
| 6 | 🐦 **Flappy Bird** | Boruların arasından geç, düşme! | 🚧 Yapılıyor |

---

## 📁 Proje Yapısı

```
ai-ide-game/
├── extension.js          # Ana VS Code extension giriş noktası (routing + VS Code API)
├── games/
│   ├── runner.js         # 🏃 Runner — sonsuz koşucu
│   ├── game2048.js       # 🔢 2048 — klasik sayı birleştirme
│   ├── crossyroad.js     # 🐸 Crossy Road — karşıdan karşıya geçiş
│   ├── codedust.js       # 🧹 Code Dust — Kazı-Kazan / scratch-off
│   ├── memory.js         # 🧠 Memory — çift eşleştirme
│   └── flappybird.js     # 🐦 Flappy Bird — boru labirenti
├── package.json
├── icon.png
├── README.md
└── TODO.md
```

> **Neden her oyun ayrı dosyada?**
> - 🔍 **Debug kolaylığı** — hata izlemek tek bir 800 satırlık dosyada değil, ilgili oyunun dosyasında
> - ♻️ **Yeniden kullanılabilirlik** — oyunları bağımsız test edebilir, ayrı geliştirip `extension.js`'e `require()` ile dahil edebilirsin
> - 👥 **Takım çalışması** — birden fazla kişi farklı oyunlar üzerinde çakışmadan çalışabilir
> - 📦 **Ölçeklenebilirlik** — yeni oyun eklemek → yeni dosya + `extension.js`'e 2 satır

---

## 🚀 Nasıl Kullanılır?

### Oyun Seçici
1. Status bar'daki **🎮 IDE Games** butonuna tıkla
2. Komut paleti (`Cmd+Shift+P` / `Ctrl+Shift+P`) → `IDE Games: Oyunları Aç`
3. Chat'te `@games` yazıp sorunuzu sorun — AI yanıt üretirken oyun başlar

### Kontroller

| Oyun | Kontrol |
|------|---------|
| **Runner** | `Space` veya Fare Tıklama → Zıpla |
| **2048** | `↑ ↓ ← →` Ok tuşları → Kaydır |
| **Crossy Road** | `↑ ↓ ← →` Ok tuşları → Hareket |
| **Code Dust** | Fare Hareketi → Kazı (tıklamaya gerek yok) |
| **Memory** | Fare Tıklama → Kart aç |
| **Flappy Bird** | `Space` veya Fare Tıklama → Kanat çırp |
| **Tüm oyunlar** | `ESC` → Kapat \| `🎮 Change Game` → Oyun seçici |

---

## 🛠️ Geliştirme

```bash
# Projeyi aç
code ai-ide-game/

# F5 → Extension Development Host açılır
# Status bar'daki 🎮 butonu ile test et

# Yeni oyun ekleme
# 1. games/yenioyun.js oluştur → module.exports = { getYeniOyunHTML }
# 2. extension.js → const { getYeniOyunHTML } = require('./games/yenioyun')
# 3. showGamePicker() listesine { label, description, game: 'yenioyun' } ekle
# 4. htmlMap nesnesine yenioyun: getYeniOyunHTML ekle
```

### Code Dust — Teknik Not

Code Dust, VS Code'un kendi temasına uyum sağlayan bir **Kazı-Kazan** oyunudur:

```js
// Üst katman → VS Code editor background rengi
const bgColor = getComputedStyle(document.body)
  .getPropertyValue('--vscode-editor-background');

// Fare hareket ettiğinde piksel sil
ctx.globalCompositeOperation = 'destination-out';
ctx.arc(x, y, brushRadius, 0, Math.PI * 2);
ctx.fill();
// → Altındaki gizli görsel veya gradient ortaya çıkar
```

---

## 🔧 Uyumluluk

- ✅ VS Code
- ✅ Cursor  
- ✅ Windsurf

---

## 📄 Lisans

MIT © berkesasa
