# Changelog

Tüm önemli değişiklikler bu dosyada belgelenir.
Format: [Keep a Changelog](https://keepachangelog.com/tr/1.0.0/)

---

## [3.0.0] — 2026-03-05

### 🆕 Eklendi
- **🔢 2048 oyunu** — klasik sayı birleştirme oyunu (`games/game2048.js`)
  - Dark premium UI, tile animasyonları (pop + merge)
  - Best score kalıcı saklama (`vscode.getState`)
  - Swipe (dokunmatik) desteği
  - "Devam Et" modu — 2048 sonrası oynamaya devam
- **`games/` klasörü** — oyunlar artık ayrı dosyalarda (yeniden kullanılabilir mimari)

### 🗑️ Kaldırıldı
- Snake oyunu
- Pong oyunu

### 🔄 Değişti
- `Tile Cleaner` → **Code Dust** (Kazı-Kazan konsepti planlandı)
- `package.json` açıklaması güncellendi

---

## [2.1.0] — 2026-03-04

### 🆕 Eklendi
- 🧹 Tile Cleaner oyunu (dual canvas, `destination-out` fırça, nebula arka planı)
- `@games` chat participant desteği

### 🔧 Düzeltildi
- Runner oyununda parçacık ömrü bitince crash hatası giderildi
- `ESC` ile panel kapatma tüm oyunlarda çalışıyor

---

## [2.0.0] — 2026-03-03

### 🆕 Eklendi
- 🏓 Pong oyunu (AI rakip)
- 🐍 Snake oyunu
- 🧠 Memory oyunu (renk eşleştirme)
- Tüm oyunlarda `Change Game` butonu
- Status bar butonu (`🎮 IDE Games`)
- `ViewColumn.One` — editör bölünmeden açılıyor

---

## [1.0.0] — 2026-02-28

### 🆕 İlk Sürüm
- 🏃 Runner oyunu (zıplama, engeller, parçacık efekti)
- `@runner` chat participant
