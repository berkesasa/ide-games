# 🎮 IDE Games — Yapılacaklar & Fikirler

> Son güncelleme: 05 Mart 2026

---

## ✅ Tamamlananlar

- [x] 🏃 Runner oyunu (zıplama, engeller, parçacık efekti)
- [x] 🧠 Memory oyunu (renk eşleştirme)
- [x] 🧹 Code Dust oyunu (dual canvas, destination-out fırça, nebula arka planı)
- [x] Tüm oyunlarda `Change Game` butonu
- [x] `ESC` ile oyun kapatma
- [x] Status bar butonu (`🎮 IDE Games`)
- [x] ViewColumn.One — editör bölünmeden açılıyor
- [x] `@games` chat participant desteği

---

## 🚧 Yapılacaklar

### 🏗️ MİMARİ YENİDEN YAPILANMA (Öncelik 1)

- [ ] **Oyunları ayrı dosyalara taşı** — her oyun kendi `games/*.js` dosyasında
  - `games/runner.js` → `getRunnerHTML(nonce)` fonksiyonu + tüm oyun kodu
  - `games/game2048.js` → `get2048HTML(nonce)` fonksiyonu + tüm oyun kodu
  - `games/crossyroad.js` → `getCrossyRoadHTML(nonce)` fonksiyonu + tüm oyun kodu
  - `games/codedust.js` → `getCodeDustHTML(nonce)` fonksiyonu + tüm oyun kodu
  - `games/memory.js` → `getMemoryHTML(nonce)` fonksiyonu + tüm oyun kodu
  - `games/flappybird.js` → `getFlappyBirdHTML(nonce)` fonksiyonu + tüm oyun kodu
  - `extension.js` → yalnızca `require()` + routing + VS Code API katmanı kalır

---

### � YENİ OYUNLAR

#### 🔢 2048
- [ ] **Klasik 2048** oyununu `games/game2048.js` dosyasında implement et
  - 4×4 grid, ok tuşlarıyla kaydırma
  - Aynı sayılar birleşince ekrana sayı artışı animasyonu
  - Renk paleti: 2→128 arası farklı renkler (pastel/neon gradyan)
  - Best score takibi (`globalState` ile kalıcı)
  - Oyun bitince "Tekrar Oyna" butonu

#### 🐸 Crossy Road
- [ ] **Crossy Road** benzeri karşıdan karşıya geçme oyunu
  - *(Örnek repo paylaşılacak — bekleniyor)*
  - Araçlardan kaç, yoldan geç
  - Kaplumbağa/log üzerinde nehir geçişi
  - Top-down perspektif, izometrik değil

---

### 🔄 MEVCUT OYUNLARIN İYİLEŞTİRMELERİ

#### 🏃 Runner
- [ ] `games/runner.js` dosyasına taşı
- [ ] Çift zıplama (double jump) ekle
- [ ] Arka pastaki paralaks kayan arka plan katmanları (uzak dağlar, yakın çalılar)
- [ ] Güç-up sistemı: kalkan, yavaşlatma, manyetizma

#### 🐦 Flappy Bird
- [ ] **Flappy Bird** oyununu `games/flappybird.js` dosyasında implement et
  - `Space` veya fare tıklaması → kuş yukarı zıplar, yerçekimi aşağı çeker
  - Boru çiftleri sağdan sola kayar, aralarından geçmek gerekir
  - Boruya veya zemine çarpınca oyun biter — "Game Over" + tekrar oyna
  - Skor: geçilen boru çifti sayısı
  - Renk paleti: vibrant mavi gökyüzü, neon borular, parlak kuş karakteri
  - Giderek artan hız (her 5 puanda borular hızlanır)

#### 🧹 Code Dust — **Kazı-Kazan (Scratch-off)**
- [ ] **Konsepti komple yeniden yaz** — eski "tile cleaner" mantığından tamamen ayrıl
- [ ] **Üst katman**: `--vscode-editor-background` CSS değişkeninden rengi oku
  ```js
  const bgColor = getComputedStyle(document.body)
    .getPropertyValue('--vscode-editor-background') || '#1e1e1e';
  ```
- [ ] **Kazıma mekaniği**: `globalCompositeOperation = 'destination-out'` ile fare
  değen pikselleri tamamen sil — tıklamaya gerek yok, sadece `mousemove`
- [ ] **Alt katmanda gizli içerik**: Gradient/nebula/constallation sahne
  (veya kullanıcıya sürpriz — oyun başlayana kadar görünmez)
- [ ] **CPU dostu tasarım**: `requestAnimationFrame` yerine yalnızca `mousemove`
  event'inde canvas güncellenir — idle'da sıfır CPU kullanımı
- [ ] **İlerleme takibi**: `getImageData` ile şeffaf piksel oranı hesapla
  (her 300ms'de bir sample al, her frame'de değil)
- [ ] Fırça boyutu seçimi: küçük/orta/büyük
- [ ] Dokunmatik/trackpad desteği (touch events)

#### 🧠 Memory Game
- [ ] `games/memory.js` dosyasına taşı
- [ ] Sadece renkler değil; emoji/ikona çiftleri (opsiyonel)
- [ ] Zorluk seviyeleri: Kolay (4×3), Normal (4×4), Zor (5×4)
- [ ] Kart açılma animasyonu (CSS 3D flip efekti)
- [ ] En az hamle rekoru (`globalState` ile kalıcı)

---

### 🛠️ Teknik İyileştirmeler

- [ ] **Checkpoint Sistemi** — `context.globalState` ile oyun state'ini kaydet
  - 2048: grid durumu + skor
  - Memory: kart pozisyonları + eşleşenler + hamle sayısı
  - Runner: sadece high score
  - UI: "Devam Et" vs "Yeni Başlat" seçeneği state varsa göster

- [ ] **Klavye Kısayolu** — `Cmd+Shift+G` (Mac) / `Ctrl+Shift+G` (Win) ile oyun aç/kapat
  - `package.json` → `keybindings` bölümüne ekle
  - Status bar tooltip'ini güncelle

- [ ] **High Score Ekranı** — tüm oyunların rekorlarını gösteren bir "Hall of Fame" ekranı

- [ ] **Tema Desteği** — VS Code'un aktif color theme'ine göre oyun renkleri uyarlansın

- [ ] **Oyun Süresi Takibi** — kaç dakika / seans oynandığını göster (globalState)

---

## 🗑️ Kaldırılanlar

- ~~🐍 Snake oyunu~~ → Listeden çıkarıldı (5 oyun sınırı)
- ~~🏓 Pong oyunu~~ → Listeden çıkarıldı (5 oyun sınırı)
- ~~🏖️ Zen Sand~~ → Listeden çıkarıldı (öncelik dışı)
- ~~🫧 Bubble Pop~~ → Listeden çıkarıldı (öncelik dışı)
- ~~🧲 Magnetic Particles~~ → Listeden çıkarıldı (öncelik dışı)

---

## 💡 Notlar

- `context.globalState` → ~`5MB` kapasiteli, VS Code kapansa bile kalıcı
- Code Dust stroke replay: `strokes[] → erase(s.x, s.y)` animasyonsuz yeniden çizer
- Chat participant (`@games`) olmadan lifecycle kontrolü mümkün değil — en iyi UX: status bar + keybinding
- Web Speech API, VS Code Webview'de (Chromium tabanlı) sorunsuz çalışıyor
- Her `games/*.js` dosyası sadece `module.exports = { getXxxHTML }` döndürmeli; VS Code API'ye dokunmamalı
