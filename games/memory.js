/**
 * 🧠 Memory — Emoji pair matching game
 * - Random difficulty each game (Easy / Normal / Hard)
 * - CSS 3D card flip animation
 * - Timer + move-based score (time & hint penalty)
 * - Per-difficulty best score via globalState
 * - Combo multiplier, shake on mismatch, confetti on match/win
 * - One-use hint (briefly reveals all cards)
 */

function getMemoryHTML(nonce) {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
<style>
/* ── Reset ──────────────────────────────────────────────────── */
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

body {
    background: #0F172A;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #E2E8F0;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100vh;
    overflow: hidden;
    user-select: none;
    padding: 10px 12px 6px;
    gap: 8px;
}

/* ── Banner ─────────────────────────────────────────────────── */
#banner {
    position: fixed; top: 0; left: 0; right: 0; z-index: 200;
    padding: 10px;
    background: linear-gradient(135deg, #6366F1, #8B5CF6);
    color: #fff; text-align: center; font-size: 13px; font-weight: 700;
    transform: translateY(-100%);
    transition: transform .5s cubic-bezier(.68,-.55,.265,1.55);
}
#banner.visible { transform: translateY(0); }

/* ── Top bar ─────────────────────────────────────────────────── */
.topbar {
    display: flex; align-items: center;
    justify-content: space-between;
    width: 100%; max-width: 580px;
}
.title { font-size: 14px; font-weight: 700; color: #64748B; letter-spacing: 1px; }

.stats-row { display: flex; gap: 8px; align-items: center; }
.stat-box {
    background: #1E293B; border: 1px solid #334155;
    border-radius: 8px; padding: 3px 10px; text-align: center; min-width: 56px;
}
.stat-label { font-size: 8px; font-weight: 700; color: #64748B; letter-spacing: 1px; text-transform: uppercase; }
.stat-value { font-size: 16px; font-weight: 800; color: #F1F5F9; line-height: 1.3; }
.stat-box.best .stat-value { color: #FBBF24; }

.change-btn {
    font-size: 11px; font-weight: 600; color: #818CF8; cursor: pointer;
    padding: 4px 10px; border-radius: 6px; border: 1px solid #334155;
    background: #1E293B; transition: all .2s; white-space: nowrap;
}
.change-btn:hover { background: #334155; color: #A5B4FC; border-color: #818CF8; }

/* ── Difficulty badge ───────────────────────────────────────── */
.diff-row { display: flex; align-items: center; gap: 10px; width: 100%; max-width: 580px; }
.diff-badge {
    font-size: 10px; font-weight: 800; letter-spacing: 2px;
    padding: 3px 12px; border-radius: 20px; border: 1px solid;
    text-transform: uppercase;
}
.combo-toast {
    font-size: 12px; font-weight: 800; color: #FBBF24;
    opacity: 0; transition: opacity .2s;
    text-shadow: 0 0 10px rgba(251,191,36,.7);
}
.combo-toast.show { opacity: 1; }

/* ── Card grid ──────────────────────────────────────────────── */
.card-grid {
    display: grid;
    gap: 10px;
    width: 100%; max-width: 580px;
    justify-content: center;
    align-content: center;
    padding: 4px;
}

/* ── 3D Card ─────────────────────────────────────────────────── */
.card {
    perspective: 900px;
    cursor: pointer;
}
.card-inner {
    position: relative; width: 100%; height: 100%;
    transform-style: preserve-3d;
    transition: transform 0.42s cubic-bezier(0.4, 0, 0.2, 1);
}
.card.flipped .card-inner  { transform: rotateY(180deg); }
.card.matched .card-inner  { transform: rotateY(180deg); }

.card-face {
    position: absolute; inset: 0;
    backface-visibility: hidden;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
}

/* Card back — branded */
.card-back {
    background: #1a2236;
    border: 2px solid #3B5070;
    flex-direction: column;
}
.card-logo { font-size: 22px; opacity: 0.6; }

/* Card front */
.card-front {
    transform: rotateY(180deg);
    background: #1E293B;
    border: 2px solid #475569;
    font-size: 30px;
}

/* Matched glow */
.card.matched .card-front {
    border-color: transparent;
    box-shadow: 0 0 16px var(--match-glow, rgba(99,102,241,.6));
    animation: matchPulse .4s ease-out both;
}
@keyframes matchPulse {
    0%   { transform: rotateY(180deg) scale(1); }
    40%  { transform: rotateY(180deg) scale(1.12); }
    100% { transform: rotateY(180deg) scale(1); }
}

/* No shake — mismatch cards flip back smoothly */

/* ── Bottom bar ─────────────────────────────────────────────── */
.bottom-bar {
    display: flex; align-items: center; justify-content: space-between;
    width: 100%; max-width: 580px; gap: 8px;
}
.hint-btn, .new-btn, .diff-btn {
    font-size: 11px; font-weight: 700; border: none; border-radius: 6px;
    padding: 5px 14px; cursor: pointer; transition: opacity .2s, transform .1s;
    white-space: nowrap;
}
.hint-btn { background: #334155; color: #94A3B8; }
.hint-btn:hover:not(:disabled) { background: #475569; color: #E2E8F0; }
.hint-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.diff-btn { background: #1E293B; color: #818CF8; border: 1px solid #334155; }
.diff-btn:hover { background: #334155; color: #A5B4FC; }
.new-btn {
    background: linear-gradient(135deg, #6366F1, #8B5CF6);
    color: #fff; box-shadow: 0 0 12px rgba(99,102,241,.4);
}
.new-btn:hover { opacity: .88; transform: scale(1.03); }
.hint-text { font-size: 10px; color: #475569; font-weight: 500; text-align: center; flex: 1; }

/* ── Win overlay ─────────────────────────────────────────────── */
.win-overlay {
    position: fixed; inset: 0; z-index: 100;
    background: rgba(15,23,42,.88);
    backdrop-filter: blur(6px);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 12px;
    opacity: 0; pointer-events: none;
    transition: opacity .35s;
}
.win-overlay.active { opacity: 1; pointer-events: auto; }
.win-emoji { font-size: 56px; animation: popIn .4s cubic-bezier(.34,1.56,.64,1) both; }
@keyframes popIn { from { transform: scale(0.3); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.win-title { font-size: 26px; font-weight: 900; color: #F1F5F9; }
.win-stats { font-size: 12px; color: #64748B; font-weight: 600; letter-spacing: .5px; }
.win-score { text-align: center; }
.overlay-btn {
    font-size: 13px; font-weight: 700; color: #fff;
    background: linear-gradient(135deg, #6366F1, #8B5CF6);
    border: none; border-radius: 8px; padding: 10px 28px; cursor: pointer;
    box-shadow: 0 0 18px rgba(99,102,241,.5);
    transition: transform .15s, box-shadow .15s;
}
.overlay-btn:hover { transform: scale(1.05); box-shadow: 0 0 28px rgba(99,102,241,.7); }

/* ── Confetti canvas ─────────────────────────────────────────── */
#confettiCanvas {
    position: fixed; inset: 0;
    pointer-events: none; z-index: 150;
}
</style>
</head>
<body>

<div id="banner">✨ AI Response Ready!</div>
<canvas id="confettiCanvas"></canvas>

<!-- Top bar -->
<div class="topbar">
    <span class="title">🧠 MEMORY</span>
    <div class="stats-row">
        <div class="stat-box">
            <div class="stat-label">Time</div>
            <div class="stat-value" id="stTimer">0:00</div>
        </div>
        <div class="stat-box">
            <div class="stat-label">Moves</div>
            <div class="stat-value" id="stMoves">0</div>
        </div>
        <div class="stat-box">
            <div class="stat-label">Score</div>
            <div class="stat-value" id="stScore">—</div>
        </div>
        <div class="stat-box best">
            <div class="stat-label">Best</div>
            <div class="stat-value" id="stBest">—</div>
        </div>
    </div>
    <button class="change-btn" id="changeBtn">🎮 Change</button>
</div>

<!-- Difficulty row -->
<div class="diff-row">
    <div class="diff-badge" id="diffBadge">EASY</div>
    <button class="diff-btn" id="diffBtn">⚙️ Difficulty</button>
    <div class="combo-toast" id="comboToast">🔥 2× COMBO!</div>
</div>

<!-- Card grid -->
<div class="card-grid" id="cardGrid"></div>

<!-- Bottom bar -->
<div class="bottom-bar">
    <button class="hint-btn" id="hintBtn">💡 Hint</button>
    <span class="hint-text">CLICK CARDS → Find pairs | ESC → Close</span>
    <button class="new-btn" id="newBtn">New Game</button>
</div>

<!-- Win overlay -->
<div class="win-overlay" id="winOverlay">
    <div class="win-emoji">🎉</div>
    <div class="win-title">Complete!</div>
    <div class="win-stats" id="winStats"></div>
    <div class="win-score" id="winScore"></div>
    <button class="overlay-btn" id="playAgainBtn">Play Again</button>
</div>

<script nonce="${nonce}">
// ── VS Code API ───────────────────────────────────────────────
const vscode = acquireVsCodeApi();

window.addEventListener('message', e => {
    const msg = e.data;
    if (msg.type === 'aiResponseComplete') {
        document.getElementById('banner').classList.add('visible');
    } else if (msg.type === 'globalLoaded' && msg.key === 'memory_best') {
        bestScores = msg.value || {};
        updateBestDisplay();
    }
});

document.addEventListener('keydown', e => {
    if (e.code === 'Escape') { e.preventDefault(); vscode.postMessage({ type: 'closeGame' }); }
});
document.getElementById('changeBtn').addEventListener('click', () => vscode.postMessage({ type: 'changeGame' }));

// ── Difficulties ──────────────────────────────────────────────
const DIFFICULTIES = [
    { name: 'Easy',   cols: 3, rows: 4, pairs: 6,  color: '#10B981', colorDim: '#10B98133', mult: 1.0 },
    { name: 'Normal', cols: 4, rows: 4, pairs: 8,  color: '#6366F1', colorDim: '#6366F133', mult: 1.5 },
    { name: 'Hard',   cols: 4, rows: 5, pairs: 10, color: '#EC4899', colorDim: '#EC489933', mult: 2.2 },
];

// ── Emoji pool (20 unique) ────────────────────────────────────
const EMOJI_POOL = [
    '🐙','🦋','🚀','🎸','🍕','🦊','🐉','🧩',
    '🌊','🦄','🔮','⚡','🎭','🦁','🌈','🍄',
    '🎯','🏆','💎','🌸'
];

// ── State ─────────────────────────────────────────────────────
let diff, cards, flipped, matchedSet, moves, lock, done;
let startTime, timerInterval, elapsedMs;
let combo, hintUsed;
let bestScores = {};
let pendingFlipBack = null;
let currentDiffIdx = 0; // 0=Easy, 1=Normal, 2=Hard — starts on Easy

// ── Confetti ──────────────────────────────────────────────────
const CC = document.getElementById('confettiCanvas');
const CX = CC.getContext('2d');
let confettiParticles = [], confRunning = false;

function resizeCC() { CC.width = window.innerWidth; CC.height = window.innerHeight; }
resizeCC();
window.addEventListener('resize', resizeCC);

const CCOLS = ['#FF6B6B','#FBBF24','#10B981','#6366F1','#EC4899','#06B6D4','#fff'];

function spawnConfettiAt(x, y, n) {
    for (let i = 0; i < n; i++) {
        const angle = Math.random() * Math.PI * 2;
        const sp = 3 + Math.random() * 7;
        confettiParticles.push({
            x, y,
            vx: Math.cos(angle) * sp,
            vy: Math.sin(angle) * sp - 3,
            size: 4 + Math.random() * 5,
            color: CCOLS[Math.floor(Math.random() * CCOLS.length)],
            life: 1, rot: Math.random() * Math.PI * 2,
            rotV: (Math.random() - 0.5) * 0.22
        });
    }
    if (!confRunning) runConfetti();
}

function bigConfetti() {
    spawnConfettiAt(window.innerWidth / 2, window.innerHeight / 2, 100);
}

function spawnCardConfetti(elA, elB) {
    [elA, elB].forEach(el => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        spawnConfettiAt(r.left + r.width / 2, r.top + r.height / 2, 16);
    });
}

function runConfetti() {
    confRunning = true;
    CX.clearRect(0, 0, CC.width, CC.height);
    confettiParticles = confettiParticles.filter(p => p.life > 0);
    for (const p of confettiParticles) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.18;
        p.life -= 0.016; p.rot += p.rotV;
        if (p.life > 0) {
            CX.save(); CX.globalAlpha = p.life;
            CX.translate(p.x, p.y); CX.rotate(p.rot);
            CX.fillStyle = p.color;
            CX.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            CX.restore();
        }
    }
    if (confettiParticles.length > 0) requestAnimationFrame(runConfetti);
    else { confRunning = false; CX.clearRect(0, 0, CC.width, CC.height); }
}

// ── Persistence ───────────────────────────────────────────────
function loadBestScores() {
    vscode.postMessage({ type: 'loadGlobal', key: 'memory_best', defaultValue: {} });
}
function saveBestScores() {
    vscode.postMessage({ type: 'saveGlobal', key: 'memory_best', value: bestScores });
}

// ── Helpers ───────────────────────────────────────────────────
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
function $(id) { return document.getElementById(id); }
function cardEl(idx) { return document.querySelector('.card[data-idx="'+idx+'"]'); }

// ── Timer ─────────────────────────────────────────────────────
function startTimer() {
    startTime = Date.now() - elapsedMs;
    timerInterval = setInterval(() => {
        elapsedMs = Date.now() - startTime;
        const s = Math.floor(elapsedMs / 1000);
        $('stTimer').textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    }, 100);
}
function stopTimer() { clearInterval(timerInterval); }

// ── Score ─────────────────────────────────────────────────────
function calcScore() {
    const secs = Math.floor(elapsedMs / 1000);
    const base = diff.pairs * 200 * diff.mult;
    const movePen = Math.max(0, (moves - diff.pairs) * 10);
    const timePen = secs * 2;
    const hintPen = hintUsed ? 120 : 0;
    return Math.max(50, Math.round(base - movePen - timePen - hintPen));
}

function updateBestDisplay() {
    const b = bestScores[diff ? diff.name : ''];
    $('stBest').textContent = b ? b.toLocaleString() : '—';
}

// ── Game init ─────────────────────────────────────────────────
function startGame() {
    diff = DIFFICULTIES[currentDiffIdx];

    // Difficulty badge
    const badge = $('diffBadge');
    badge.textContent = diff.name.toUpperCase();
    badge.style.background = diff.colorDim;
    badge.style.color = diff.color;
    badge.style.borderColor = diff.color + '88';

    // Pick emojis
    const emojis = shuffle([...EMOJI_POOL]).slice(0, diff.pairs);
    const all = shuffle([...emojis, ...emojis]);
    cards = all.map((emoji, i) => ({ emoji, id: i, matched: false, flipped: false }));

    flipped = []; matchedSet = new Set();
    moves = 0; lock = false; done = false;
    combo = 0; hintUsed = false; elapsedMs = 0;

    // Reset UI
    $('stMoves').textContent = '0';
    $('stScore').textContent = '—';
    $('stTimer').textContent = '0:00';
    $('hintBtn').disabled = false;
    $('hintBtn').textContent = '💡 Hint';
    $('comboToast').classList.remove('show');
    $('winOverlay').classList.remove('active');

    stopTimer();
    updateBestDisplay();
    renderGrid();
}

// ── Render grid ───────────────────────────────────────────────
function renderGrid() {
    const grid = $('cardGrid');
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = 'repeat(' + diff.cols + ', 1fr)';

    // Compute square card size from both constraints
    const GAP = 10;
    const availW = Math.min(window.innerWidth - 32, 580);
    const availH = window.innerHeight - 200;
    const fromW = Math.floor((availW - (diff.cols - 1) * GAP) / diff.cols);
    const fromH = Math.floor((availH - (diff.rows - 1) * GAP) / diff.rows);
    const size = Math.min(fromW, fromH, 108);

    grid.style.gap = GAP + 'px';
    grid.style.gridTemplateColumns = 'repeat(' + diff.cols + ', ' + size + 'px)';
    grid.style.gridAutoRows = size + 'px';

    cards.forEach((card, i) => {
        const el = document.createElement('div');
        el.className = 'card';
        el.dataset.idx = i;
        el.innerHTML =
            '<div class="card-inner">' +
            '  <div class="card-face card-back"><span class="card-logo">🎮</span></div>' +
            '  <div class="card-face card-front"><span>' + card.emoji + '</span></div>' +
            '</div>';
        el.addEventListener('click', () => onCardClick(i));
        grid.appendChild(el);
    });
}

// ── Card flip helpers ─────────────────────────────────────────
function flipShow(idx) { const el = cardEl(idx); if (el) el.classList.add('flipped'); }
function flipHide(idx) { const el = cardEl(idx); if (el) el.classList.remove('flipped'); }
function setMatched(idxA, idxB) {
    [idxA, idxB].forEach(i => {
        const el = cardEl(i);
        if (el) {
            el.classList.add('matched');
            el.style.setProperty('--match-glow', diff.color + '88');
        }
    });
}
function shakeCards(idxA, idxB) {
    [idxA, idxB].forEach(i => {
        const el = cardEl(i);
        if (!el) return;
        el.classList.remove('shake');
        void el.offsetWidth; // reflow to restart animation
        el.classList.add('shake');
        setTimeout(() => el.classList.remove('shake'), 600);
    });
}

// ── Click handler ─────────────────────────────────────────────
function onCardClick(idx) {
    // If 2 mismatched cards are waiting to flip back, do it immediately
    if (pendingFlipBack !== null) {
        clearTimeout(pendingFlipBack);
        pendingFlipBack = null;
        const [a, b] = flipped;
        cards[a].flipped = false; cards[b].flipped = false;
        flipHide(a); flipHide(b);
        flipped = []; lock = false;
    }

    if (lock || done) return;
    if (cards[idx].matched || cards[idx].flipped) return;

    // Start timer on first click
    if (moves === 0 && flipped.length === 0) startTimer();

    cards[idx].flipped = true;
    flipShow(idx);
    flipped.push(idx);

    if (flipped.length === 2) {
        lock = true;
        moves++;
        $('stMoves').textContent = moves;
        const [a, b] = flipped;

        if (cards[a].emoji === cards[b].emoji) {
            // ✅ Match!
            combo++;
            setTimeout(() => {
                cards[a].matched = true; cards[b].matched = true;
                matchedSet.add(a); matchedSet.add(b);
                setMatched(a, b);
                spawnCardConfetti(cardEl(a), cardEl(b));
                flipped = []; lock = false;

                if (combo >= 2) showCombo(combo);

                if (matchedSet.size === cards.length) {
                    stopTimer();
                    done = true;
                    setTimeout(showWin, 600);
                }
            }, 250);
        } else {
            // ❌ Mismatch — flip back after short preview, or immediately on next click
            combo = 0;
            pendingFlipBack = setTimeout(() => {
                pendingFlipBack = null;
                cards[a].flipped = false; cards[b].flipped = false;
                flipHide(a); flipHide(b);
                flipped = []; lock = false;
            }, 800);
        }
    }
}

// ── Combo toast ───────────────────────────────────────────────
function showCombo(n) {
    const el = $('comboToast');
    el.textContent = '🔥 ' + n + '× COMBO!';
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 1300);
}

// ── Hint ──────────────────────────────────────────────────────
$('hintBtn').addEventListener('click', () => {
    if (hintUsed || done || lock) return;
    hintUsed = true;
    $('hintBtn').disabled = true;
    $('hintBtn').textContent = '💡 Used';

    const unmatched = cards.map((_, i) => i).filter(i => !cards[i].matched && !cards[i].flipped);
    unmatched.forEach(i => flipShow(i));
    lock = true;
    setTimeout(() => {
        unmatched.forEach(i => { if (!cards[i].matched && !flipped.includes(i)) flipHide(i); });
        lock = false;
    }, 1100);
});

// ── Win screen ────────────────────────────────────────────────
function showWin() {
    const finalScore = calcScore();
    const secs = Math.floor(elapsedMs / 1000);
    const m = Math.floor(secs / 60), s = secs % 60;

    const prev = bestScores[diff.name] || 0;
    const isNew = finalScore > prev;
    if (isNew) { bestScores[diff.name] = finalScore; saveBestScores(); updateBestDisplay(); }

    $('stScore').textContent = finalScore.toLocaleString();
    $('winStats').textContent =
        diff.name + ' • ' + moves + ' moves • ' +
        m + ':' + String(s).padStart(2, '0') +
        (hintUsed ? ' • hint used' : '');
    $('winScore').innerHTML =
        '<span style="font-size:34px;font-weight:900;color:' + diff.color + '">' +
        finalScore.toLocaleString() + '</span>' +
        (isNew ? ' <span style="color:#FBBF24;font-size:13px;display:block;margin-top:2px">🏆 New Best!</span>' : '');
    $('winOverlay').classList.add('active');
    bigConfetti();
}

// ── Buttons ───────────────────────────────────────────────────
$('newBtn').addEventListener('click', startGame);
$('playAgainBtn').addEventListener('click', startGame);
$('diffBtn').addEventListener('click', () => {
    currentDiffIdx = (currentDiffIdx + 1) % DIFFICULTIES.length;
    startGame();
});

// ── Boot ──────────────────────────────────────────────────────
loadBestScores();
startGame();
</script>
</body>
</html>`;
}

module.exports = { getMemoryHTML };
