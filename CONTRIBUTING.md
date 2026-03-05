# 🤝 Contributing to IDE Games

Katkıda bulunmak istediğin için teşekkürler! Aşağıdaki kılavuz süreci kolaylaştırır.

---

## 🚀 Geliştirme Ortamı

```bash
# Repoyu klonla
git clone https://github.com/berkesasa/ide-games.git
cd ide-games

# VS Code'da aç
code .

# F5 → "Run Extension" → Extension Development Host açılır
# Status bar'daki 🎮 butonuyla test et
```

## 📁 Proje Yapısı

```
ide-games/
├── extension.js        # Ana giriş noktası — VS Code API + routing
├── games/              # Her oyun kendi dosyasında
│   ├── game2048.js     # 🔢 2048
│   ├── runner.js       # 🏃 Runner
│   ├── codedust.js     # 🧹 Code Dust
│   ├── memory.js       # 🧠 Memory
│   └── flappybird.js   # 🐦 Flappy Bird
├── package.json
├── icon.png
└── README.md
```

## 🎮 Yeni Oyun Eklemek

1. `games/yenioyun.js` oluştur:
   ```js
   function getYeniOyunHTML(nonce) {
       return `<!DOCTYPE html>...`;
   }
   module.exports = { getYeniOyunHTML };
   ```

2. `extension.js` içinde dahil et:
   ```js
   const { getYeniOyunHTML } = require('./games/yenioyun');
   ```

3. `showGamePicker()` listesine ekle:
   ```js
   { label: '🎯 Yeni Oyun', description: 'Açıklama', game: 'yenioyun' }
   ```

4. `createGamePanel()` içindeki `titles` ve `htmlMap` nesnelerine ekle.

## 🔧 Kurallar

- Her oyun **kendi `.js` dosyasında** bulunmalı — `extension.js`'e oyun kodu yazma
- Oyun dosyaları yalnızca `module.exports = { getXxxHTML }` dışa aktarmalı; VS Code API kullanmamalı
- WebView'de `Content-Security-Policy` her zaman korunmalı (`nonce` kullan)
- `ESC` → kapatma ve `🎮 Change Game` → oyun seçici her oyunda çalışmalı
- Yeni bir oyun açarken `baseScript()` ve `baseCSS()` yardımcılarını kullan

## 📬 Pull Request

1. Fork'la
2. Feature branch oluştur: `git checkout -b feat/yeni-oyun-adi`
3. Değişikliklerini commit'le: `git commit -m "feat: Yeni Oyun eklendi"`
4. Push'la: `git push origin feat/yeni-oyun-adi`
5. Pull Request aç — oyun adını, kontrolleri ve ekran görüntüsünü açıklamaya ekle

## 🐛 Bug Bildirimi

GitHub Issues üzerinden bildir. Şunları ekle:
- VS Code / Cursor sürümü
- İşletim sistemi
- Hatanın nasıl tetiklendiği
- Hata mesajı (varsa)
