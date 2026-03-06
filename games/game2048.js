/**
 * 🔢 2048 — VS Code WebView Game
 *
 * Referans: 2048-ref/app.js (move + combine mantığı)
 * Geliştirmeler:
 *   - Dark premium UI (VS Code uyumlu renk paleti)
 *   - CSS tile animasyonları (pop + slide)
 *   - Best score takibi (VSCode globalState üzerinden)
 *   - Swipe (dokunmatik) desteği
 *   - Tekrar oyna + Change Game entegrasyonu
 *   - ESC → kapat
 */

function get2048HTML(nonce) {
    return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
<style>
/* ── Reset & Base ───────────────────────────────────── */
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

body {
    background: #0F172A;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
    color: #E2E8F0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    overflow: hidden;
    user-select: none;
}

/* ── AI Response Banner ─────────────────────────────── */
#banner {
    position: fixed;
    top: 0; left: 0; right: 0;
    padding: 10px;
    background: linear-gradient(135deg, #6366F1, #8B5CF6);
    color: white;
    text-align: center;
    font-size: 13px;
    font-weight: 700;
    transform: translateY(-100%);
    transition: transform .5s cubic-bezier(.68,-.55,.265,1.55);
    z-index: 100;
}
#banner.visible { transform: translateY(0); }

/* ── Top Bar ─────────────────────────────────────────── */
.topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    max-width: 420px;
    padding: 0 2px 10px;
}

.game-title {
    font-size: 42px;
    font-weight: 900;
    background: linear-gradient(135deg, #FBBF24, #F59E0B);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    line-height: 1;
    letter-spacing: -1px;
}

.scores-row {
    display: flex;
    gap: 8px;
    align-items: center;
}

.score-box {
    background: #1E293B;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 4px 14px;
    text-align: center;
    min-width: 72px;
}
.score-box .label {
    font-size: 9px;
    font-weight: 700;
    color: #64748B;
    letter-spacing: 1px;
    text-transform: uppercase;
}
.score-box .value {
    font-size: 20px;
    font-weight: 800;
    color: #F1F5F9;
    line-height: 1.2;
}
.score-box.best .value { color: #FBBF24; }

.change-btn {
    font-size: 11px;
    font-weight: 600;
    color: #818CF8;
    cursor: pointer;
    padding: 0 12px;
    border-radius: 6px;
    border: 1px solid #334155;
    background: #1E293B;
    transition: all .2s;
    letter-spacing: .3px;
    white-space: nowrap;
    align-self: stretch;
}
.change-btn:hover { background: #334155; color: #A5B4FC; border-color: #818CF8; }

/* ── Sub Row (hint + new game) ─────────────────────── */
.subrow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    max-width: 420px;
    margin-bottom: 10px;
}
.subtitle {
    font-size: 12px;
    color: #475569;
}
.new-btn {
    font-size: 11px;
    font-weight: 700;
    color: #fff;
    background: linear-gradient(135deg, #6366F1, #8B5CF6);
    border: none;
    border-radius: 6px;
    padding: 5px 14px;
    cursor: pointer;
    transition: opacity .2s, transform .1s;
}
.new-btn:hover { opacity: .88; transform: scale(1.03); }
.new-btn:active { transform: scale(0.97); }

/* ── Grid Board ─────────────────────────────────────── */
.board-wrap {
    position: relative;
    width: 420px;
    padding: 10px;
    background: #1E293B;
    border: 1px solid #334155;
    border-radius: 14px;
    box-shadow: 0 8px 32px rgba(0,0,0,.5);
}

.grid-bg {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(4, 1fr);
    gap: 10px;
    width: 100%;
    height: 400px;
    position: relative;
}

/* Empty cell placeholders */
.cell-bg {
    background: #0F172A;
    border-radius: 8px;
    border: 1px solid #1E293B;
}

/* Tiles overlay */
.tiles-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
}

.tile {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    font-weight: 900;
    font-size: 28px;
    line-height: 1;
    transition: background .12s ease, color .12s ease;
    overflow: hidden;
}

/* Tile pop animation on spawn */
@keyframes tile-pop {
    0%   { transform: scale(0.4); opacity: 0; }
    70%  { transform: scale(1.12); }
    100% { transform: scale(1);   opacity: 1; }
}
.tile.new { animation: tile-pop .22s cubic-bezier(.34,1.56,.64,1) both; }

/* Tile merge animation */
@keyframes tile-merge {
    0%   { transform: scale(1); }
    40%  { transform: scale(1.2); }
    100% { transform: scale(1); }
}
.tile.merged { animation: tile-merge .18s ease-out both; }

/* ── Tile Colors (dark palette) ──────────────────────── */
.t-0    { background: transparent; }
.t-2    { background: #2D3748; color: #E2E8F0; font-size: 28px; }
.t-4    { background: #374151; color: #F3F4F6; font-size: 28px; }
.t-8    { background: #92400E; color: #FEF3C7; font-size: 28px; }
.t-16   { background: #B45309; color: #FEF3C7; font-size: 26px; }
.t-32   { background: #C2410C; color: #FFF7ED; font-size: 26px; }
.t-64   { background: #DC2626; color: #FEF2F2; font-size: 26px; }
.t-128  { background: #7C3AED; color: #EDE9FE; font-size: 22px; box-shadow: 0 0 16px rgba(124,58,237,.5); }
.t-256  { background: #6D28D9; color: #EDE9FE; font-size: 22px; box-shadow: 0 0 18px rgba(109,40,217,.6); }
.t-512  { background: #4F46E5; color: #EEF2FF; font-size: 22px; box-shadow: 0 0 20px rgba(79,70,229,.65); }
.t-1024 { background: #0369A1; color: #E0F2FE; font-size: 18px; box-shadow: 0 0 22px rgba(3,105,161,.7); }
.t-2048 {
    background: linear-gradient(135deg, #FBBF24, #F59E0B);
    color: #fff;
    font-size: 18px;
    box-shadow: 0 0 28px rgba(251,191,36,.8), 0 0 8px rgba(245,158,11,.9);
}
.t-high {
    background: linear-gradient(135deg, #EC4899, #8B5CF6);
    color: #fff;
    font-size: 14px;
    box-shadow: 0 0 24px rgba(236,72,153,.7);
}

/* ── Overlay: Game Over / Win ────────────────────────── */
.overlay {
    position: absolute;
    inset: 0;
    border-radius: 14px;
    background: rgba(15,23,42,.82);
    backdrop-filter: blur(4px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    opacity: 0;
    pointer-events: none;
    transition: opacity .3s;
    z-index: 10;
}
.overlay.active { opacity: 1; pointer-events: auto; }
.overlay-title {
    font-size: 28px;
    font-weight: 900;
}
.overlay-sub { font-size: 13px; color: #94A3B8; }
.overlay-btn {
    margin-top: 6px;
    font-size: 13px;
    font-weight: 700;
    color: #fff;
    background: linear-gradient(135deg, #6366F1, #8B5CF6);
    border: none;
    border-radius: 8px;
    padding: 8px 24px;
    cursor: pointer;
    box-shadow: 0 0 18px rgba(99,102,241,.5);
    transition: transform .15s, box-shadow .15s;
}
.overlay-btn:hover { transform: scale(1.05); box-shadow: 0 0 28px rgba(99,102,241,.7); }

/* ── Hint ───────────────────────────────────────────── */
.hint {
    margin-top: 10px;
    font-size: 11px;
    color: #334155;
}
</style>
</head>
<body>

<div id="banner">✨ AI Response Ready!</div>

<!-- Top Bar -->
<div class="topbar">
    <div class="game-title">2048</div>
    <div class="scores-row">
        <div class="score-box">
            <div class="label">Score</div>
            <div class="value" id="scoreVal">0</div>
        </div>
        <div class="score-box best">
            <div class="label">Best</div>
            <div class="value" id="bestVal">0</div>
        </div>
        <button class="change-btn" id="changeBtn">🎮 Change</button>
    </div>
</div>

<!-- Sub row -->
<div class="subrow">
    <span class="subtitle">Combine tiles → reach <b style="color:#FBBF24">2048!</b></span>
    <button class="new-btn" id="newBtn">New Game</button>
</div>

<!-- Board -->
<div class="board-wrap">
    <!-- Static empty cell backgrounds -->
    <div class="grid-bg" id="gridBg"></div>
    <!-- Dynamic tiles -->
    <div class="tiles-layer" id="tilesLayer"></div>

    <!-- Overlays -->
    <div class="overlay" id="winOverlay">
        <div class="overlay-title">🏆 You Win!</div>
        <div class="overlay-sub" id="winScore"></div>
        <button class="overlay-btn" id="continueBtn">Continue</button>
        <button class="overlay-btn" style="background:linear-gradient(135deg,#334155,#1E293B);margin-top:0;box-shadow:none;" id="restartFromWin">Restart</button>
    </div>
    <div class="overlay" id="startOverlay">
        <div class="overlay-title" style="color:#FBBF24">💾 Saved Game</div>
        <div class="overlay-sub" id="savedScore"></div>
        <button class="overlay-btn" id="continueFromSave">Continue</button>
        <button class="overlay-btn" style="background:linear-gradient(135deg,#334155,#1E293B);margin-top:0;box-shadow:none;" id="newFromSave">New Game</button>
    </div>
    <div class="overlay" id="loseOverlay">
        <div class="overlay-title" style="color:#EF4444">💫 Game Over</div>
        <div class="overlay-sub" id="loseScore"></div>
        <button class="overlay-btn" id="restartFromLose">Play Again</button>
    </div>
</div>

<div class="hint">↑ ↓ ← → Arrow keys or WASD | ESC → Close</div>

<script nonce="${nonce}">
// ── VS Code API ──────────────────────────────────────────────
const vscode = acquireVsCodeApi();

// AI banner
window.addEventListener('message', e => {
    const msg = e.data;
    if (msg.type === 'aiResponseComplete') {
        document.getElementById('banner').classList.add('visible');
    } else if (msg.type === 'stateLoaded') {
        handleCheckpointLoad(msg.payload);
    } else if (msg.type === 'bestLoaded') {
        bestScore = msg.payload || 0;
        document.getElementById('bestVal').textContent = bestScore;
    }
});

// ESC → close
document.addEventListener('keydown', e => {
    if (e.code === 'Escape') { e.preventDefault(); vscode.postMessage({ type: 'closeGame' }); }
});

// Change Game button
document.getElementById('changeBtn').addEventListener('click', () => {
    vscode.postMessage({ type: 'changeGame' });
});

// Best score
let bestScore = 0;

// ── Persistence helpers ──────────────────────────────────────
function saveCheckpoint() {
    vscode.postMessage({
        type: 'saveState',
        payload: { board: board.slice(), score, won }
    });
}

function clearCheckpoint() {
    vscode.postMessage({ type: 'saveState', payload: null });
}

function saveBest() {
    vscode.postMessage({ type: 'saveBest', payload: bestScore });
}

function handleCheckpointLoad(checkpoint) {
    // Use requestAnimationFrame to ensure DOM is fully laid out before render()
    requestAnimationFrame(() => {
        if (checkpoint && Array.isArray(checkpoint.board)) {
            board = checkpoint.board.map(Number); // guard against stringified values
            score = checkpoint.score || 0;
            won   = checkpoint.won   || false;
            over  = false;
            render();
            updateScoreDisplay();
            document.getElementById('savedScore').textContent = 'Score: ' + score;
            document.getElementById('startOverlay').classList.add('active');
        } else {
            // No checkpoint — start fresh
            initBoard();
        }
    });
}

// ── Game State ───────────────────────────────────────────────
const SIZE = 4;
let board = [];
let score = 0;
let won   = false;
let over  = false;

// ── DOM helpers ──────────────────────────────────────────────
const gridBg     = document.getElementById('gridBg');
const tilesLayer = document.getElementById('tilesLayer');

// Build static bg cells (16 empty divs)
for (let i = 0; i < SIZE * SIZE; i++) {
    const bg = document.createElement('div');
    bg.className = 'cell-bg';
    gridBg.appendChild(bg);
}

// ── Board Init ───────────────────────────────────────────────
function initBoard() {
    board = Array(SIZE * SIZE).fill(0);
    score = 0;
    won   = false;
    over  = false;
    addRandom();
    addRandom();
    render();
    updateScoreDisplay();
    hideOverlays();
    clearCheckpoint();
}

function addRandom() {
    const empty = board.reduce((acc, v, i) => { if (v === 0) acc.push(i); return acc; }, []);
    if (empty.length === 0) return;
    const idx = empty[Math.floor(Math.random() * empty.length)];
    board[idx] = Math.random() < 0.9 ? 2 : 4;
    return idx;
}

// ── Render ───────────────────────────────────────────────────
let newTiles    = new Set();
let mergedTiles = new Set();

function getTileMetrics() {
    const totalSize = tilesLayer.offsetWidth || 400; // fallback if DOM not yet laid out
    const GAP = 10;
    const tileSize = (totalSize - GAP * (SIZE + 1)) / SIZE;
    return { tileSize, GAP };
}

function render() {
    tilesLayer.innerHTML = '';
    const { tileSize, GAP } = getTileMetrics();
    board.forEach((val, i) => {
        if (val === 0) return;
        const row = Math.floor(i / SIZE);
        const col = i % SIZE;
        const tile = document.createElement('div');
        tile.className = 'tile ' + tileClass(val);
        tile.textContent = val;
        tile.style.width  = tileSize + 'px';
        tile.style.height = tileSize + 'px';
        tile.style.left   = (GAP + col * (tileSize + GAP)) + 'px';
        tile.style.top    = (GAP + row * (tileSize + GAP)) + 'px';
        if (newTiles.has(i))    tile.classList.add('new');
        if (mergedTiles.has(i)) tile.classList.add('merged');
        tilesLayer.appendChild(tile);
    });
}

function tileClass(val) {
    if (val === 0)  return 't-0';
    if (val > 2048) return 't-high';
    return 't-' + val;
}

// ── Score ────────────────────────────────────────────────────
function updateScoreDisplay() {
    document.getElementById('scoreVal').textContent = score;
    if (score > bestScore) {
        bestScore = score;
        document.getElementById('bestVal').textContent = bestScore;
        saveBest();
    }
}

// ── Move Logic ───────────────────────────────────────────────
function moveLeft() {
    let moved = false;
    newTiles.clear(); mergedTiles.clear();
    for (let r = 0; r < SIZE; r++) {
        const row = getRow(r);
        const { result, gained, changed, mergedIdx } = slideAndMerge(row);
        if (changed) moved = true;
        setRow(r, result);
        score += gained;
        mergedIdx.forEach(i => mergedTiles.add(r * SIZE + i));
    }
    if (moved) { const ni = addRandom(); if (ni !== undefined) newTiles.add(ni); }
    return moved;
}

function moveRight() {
    let moved = false;
    newTiles.clear(); mergedTiles.clear();
    for (let r = 0; r < SIZE; r++) {
        const row = getRow(r).slice().reverse();
        const { result, gained, changed, mergedIdx } = slideAndMerge(row);
        if (changed) moved = true;
        setRow(r, result.slice().reverse());
        score += gained;
        mergedIdx.forEach(i => mergedTiles.add(r * SIZE + (SIZE - 1 - i)));
    }
    if (moved) { const ni = addRandom(); if (ni !== undefined) newTiles.add(ni); }
    return moved;
}

function moveUp() {
    let moved = false;
    newTiles.clear(); mergedTiles.clear();
    for (let c = 0; c < SIZE; c++) {
        const col = getCol(c);
        const { result, gained, changed, mergedIdx } = slideAndMerge(col);
        if (changed) moved = true;
        setCol(c, result);
        score += gained;
        mergedIdx.forEach(i => mergedTiles.add(i * SIZE + c));
    }
    if (moved) { const ni = addRandom(); if (ni !== undefined) newTiles.add(ni); }
    return moved;
}

function moveDown() {
    let moved = false;
    newTiles.clear(); mergedTiles.clear();
    for (let c = 0; c < SIZE; c++) {
        const col = getCol(c).slice().reverse();
        const { result, gained, changed, mergedIdx } = slideAndMerge(col);
        if (changed) moved = true;
        setCol(c, result.slice().reverse());
        score += gained;
        mergedIdx.forEach(i => mergedTiles.add((SIZE - 1 - i) * SIZE + c));
    }
    if (moved) { const ni = addRandom(); if (ni !== undefined) newTiles.add(ni); }
    return moved;
}

function slideAndMerge(line) {
    let filtered = line.filter(v => v !== 0);
    const originalStr = line.join(',');
    let gained = 0, mergedIdx = [];
    for (let i = 0; i < filtered.length - 1; i++) {
        if (filtered[i] === filtered[i + 1]) {
            filtered[i] *= 2;
            gained += filtered[i];
            mergedIdx.push(i);
            filtered.splice(i + 1, 1);
        }
    }
    while (filtered.length < SIZE) filtered.push(0);
    const changed = filtered.join(',') !== originalStr;
    return { result: filtered, gained, changed, mergedIdx };
}

function getRow(r) { return board.slice(r * SIZE, r * SIZE + SIZE); }
function setRow(r, arr) { arr.forEach((v, i) => { board[r * SIZE + i] = v; }); }
function getCol(c) { return [0,1,2,3].map(r => board[r * SIZE + c]); }
function setCol(c, arr) { arr.forEach((v, r) => { board[r * SIZE + c] = v; }); }

// ── Win / Lose Checks ────────────────────────────────────────
function checkWin()  { return board.includes(2048); }
function checkLose() {
    if (board.includes(0)) return false;
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            const v = board[r * SIZE + c];
            if (c < SIZE-1 && board[r * SIZE + c+1] === v) return false;
            if (r < SIZE-1 && board[(r+1) * SIZE + c] === v) return false;
        }
    }
    return true;
}

// ── Overlays ─────────────────────────────────────────────────
function hideOverlays() {
    ['winOverlay','loseOverlay','startOverlay'].forEach(id =>
        document.getElementById(id).classList.remove('active')
    );
}

function showWin() {
    document.getElementById('winScore').textContent = 'Score: ' + score;
    document.getElementById('winOverlay').classList.add('active');
    clearCheckpoint(); // won — no need to keep checkpoint
}

function showLose() {
    document.getElementById('loseScore').textContent = 'Score: ' + score;
    document.getElementById('loseOverlay').classList.add('active');
    clearCheckpoint();
}

// ── After each move ──────────────────────────────────────────
function afterMove(moved) {
    if (!moved) return;
    render();
    updateScoreDisplay();
    saveCheckpoint(); // auto-save after every valid move

    if (!won && checkWin()) {
        won = true;
        setTimeout(() => showWin(), 300);
        return;
    }
    if (checkLose()) {
        over = true;
        setTimeout(() => showLose(), 300);
    }
}

// ── Keyboard Controls (Arrow keys + WASD) ────────────────────
document.addEventListener('keydown', e => {
    if (over) return;
    switch (e.key) {
        case 'ArrowLeft':  case 'a': case 'A': e.preventDefault(); afterMove(moveLeft());  break;
        case 'ArrowRight': case 'd': case 'D': e.preventDefault(); afterMove(moveRight()); break;
        case 'ArrowUp':    case 'w': case 'W': e.preventDefault(); afterMove(moveUp());    break;
        case 'ArrowDown':  case 's': case 'S': e.preventDefault(); afterMove(moveDown());  break;
    }
});

// ── Swipe (touch) Controls ───────────────────────────────────
let touchStartX = 0, touchStartY = 0;
document.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchend', e => {
    if (over) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) {
        afterMove(dx > 0 ? moveRight() : moveLeft());
    } else {
        afterMove(dy > 0 ? moveDown() : moveUp());
    }
});

// ── Button Handlers ──────────────────────────────────────────
document.getElementById('newBtn').addEventListener('click', initBoard);

document.getElementById('continueBtn').addEventListener('click', () => {
    hideOverlays(); // continue past 2048
});

document.getElementById('restartFromWin').addEventListener('click', initBoard);
document.getElementById('restartFromLose').addEventListener('click', initBoard);

document.getElementById('continueFromSave').addEventListener('click', () => {
    // User chose to resume saved game
    hideOverlays();
});

document.getElementById('newFromSave').addEventListener('click', () => {
    hideOverlays();
    initBoard();
});

// ── Boot ─────────────────────────────────────────────────────
// 1. Ask extension for best score
vscode.postMessage({ type: 'loadBest' });
// 2. Ask extension for checkpoint (response triggers handleCheckpointLoad)
vscode.postMessage({ type: 'loadState' });
</script>
</body>
</html>`;
}

module.exports = { get2048HTML };
