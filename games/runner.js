/**
 * 🏃 Runner — Endless runner game
 * - Double jump (with mid-air flip animation)
 * - 4 obstacle types: short cactus, tall cactus, wide rock, floating spike
 * - Monsters: walking slime + flying bat (with death animation)
 * - Progressive speed increase
 */

function getRunnerHTML(nonce) {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{background:#0F172A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#E2E8F0;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;overflow:hidden;user-select:none;}
.topbar{display:flex;align-items:center;justify-content:space-between;width:100%;max-width:560px;padding:8px 4px;margin-bottom:8px;}
.topbar .title{font-size:14px;font-weight:600;color:#64748B;}
.score{font-size:24px;font-weight:800;}
.hi{font-size:12px;font-weight:700;color:#FBBF24;margin-left:8px;}
.change-btn{font-size:12px;font-weight:600;color:#818CF8;cursor:pointer;padding:4px 12px;border-radius:6px;border:1px solid #334155;background:#1E293B;transition:all .2s;letter-spacing:.3px;}
.change-btn:hover{background:#334155;color:#A5B4FC;border-color:#818CF8;}
.wrap{position:relative;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.4);border:1px solid #334155;}
canvas{display:block;}
.hint{margin-top:10px;font-size:11px;color:#475569;font-weight:500;}
#banner{position:fixed;top:0;left:0;right:0;padding:12px;background:linear-gradient(135deg,#6366F1,#8B5CF6);color:white;text-align:center;font-size:13px;font-weight:700;transform:translateY(-100%);transition:transform .5s cubic-bezier(.68,-.55,.265,1.55);z-index:100;}
#banner.visible{transform:translateY(0);}
</style></head><body>
<div id="banner">✨ AI Response Ready!</div>
<div class="topbar">
    <span class="title">🏃 RUNNER</span>
    <span><span class="score" id="sc" style="color:#FF6B6B">0</span><span class="hi" id="hi"></span></span>
    <button class="change-btn" id="changeBtn">🎮 Change Game</button>
</div>
<div class="wrap"><canvas id="c" width="680" height="340"></canvas></div>
<div class="hint">SPACE or CLICK → Jump (×2 double jump) | ESC → Close</div>
<script nonce="${nonce}">
const vscode=acquireVsCodeApi();
window.addEventListener('message',e=>{if(e.data.type==='aiResponseComplete')document.getElementById('banner').classList.add('visible');});
document.addEventListener('keydown',e=>{if(e.code==='Escape'){e.preventDefault();vscode.postMessage({type:'closeGame'});}});
document.getElementById('changeBtn').addEventListener('click',()=>{vscode.postMessage({type:'changeGame'});});

// ── Canvas setup ─────────────────────────────────────────────
const C=document.getElementById('c'),X=C.getContext('2d');
const W=680,H=340,GY=H-55;

// ── Constants ────────────────────────────────────────────────
const GRAVITY=0.65, JUMP1=-12.5, JUMP2=-11, MAX_JUMPS=2;

// ── Helpers ──────────────────────────────────────────────────
function rr(ctx,x,y,w,h,r){
    ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);
    ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);
    ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);
    ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);
    ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();
}

// ── State ────────────────────────────────────────────────────
let state='playing',score=0,hiScore=0,frame=0,speed=4.2;

// Player
const P={
    x:60,y:GY-30,w:28,h:28,
    vy:0,jumpsLeft:MAX_JUMPS,grounded:true,
    angle:0,          // flip rotation
    flipping:false,   // is mid-air flip active?
    squashX:1,squashY:1
};

// Entity arrays
let obstacles=[];
let monsters=[];
let particles=[];

// ── Particles ────────────────────────────────────────────────
const PCOLS=['#FF6B6B','#FF8E53','#FBBF24','#8B5CF6','#06B6D4','#10B981'];
function spawnParticles(x,y,n,cols){
    for(let i=0;i<n;i++){
        particles.push({
            x,y,
            vx:(Math.random()-0.5)*6,
            vy:-Math.random()*5-1,
            r:2+Math.random()*3,
            life:1,
            color:(cols||PCOLS)[Math.floor(Math.random()*(cols||PCOLS).length)]
        });
    }
}

// ── Obstacle types ───────────────────────────────────────────
// type: 'short'|'tall'|'wide'|'float'
const OBS_TYPES=[
    {type:'short', w:16, hMin:18, hMax:30,  color:'#8B5CF6', ground:true},
    {type:'tall',  w:14, hMin:35, hMax:52,  color:'#EC4899', ground:true},
    {type:'wide',  w:38, hMin:16, hMax:22,  color:'#F59E0B', ground:true},
    {type:'float', w:22, hMin:14, hMax:20,  color:'#06B6D4', ground:false}, // floating spike
];

function spawnObstacle(){
    const t=OBS_TYPES[Math.floor(Math.random()*OBS_TYPES.length)];
    const h=t.hMin+Math.random()*(t.hMax-t.hMin);
    const y=t.ground ? GY-h : GY-h-55-Math.random()*35;
    obstacles.push({x:W+10, y, w:t.w, h, color:t.color, type:t.type});
}

// ── Monster types ────────────────────────────────────────────
// Slime: walks on ground, bounces; Bat: flies, oscillates vertically
function spawnMonster(){
    const isBat=Math.random()<0.4;
    if(isBat){
        const baseY=GY-110-Math.random()*40;
        monsters.push({
            kind:'bat', x:W+10,
            y:baseY, baseY,
            w:26, h:18,
            vx:0, osc:0,
            color:'#A78BFA',
            alive:true, deathTimer:0, deathVy:0
        });
    } else {
        monsters.push({
            kind:'slime', x:W+10, y:GY-24,
            w:28, h:24,
            bounce:0, bounceDir:1,
            color:'#34D399',
            alive:true, deathTimer:0, deathVy:0
        });
    }
}

// ── Draw helpers ─────────────────────────────────────────────
function drawObstacle(o){
    const gr=X.createLinearGradient(o.x,o.y,o.x+o.w,o.y+o.h);
    gr.addColorStop(0,o.color);
    gr.addColorStop(1,o.color+'99');
    X.fillStyle=gr;
    if(o.type==='float'){
        // draw spiky spike shape
        X.save();X.shadowColor=o.color;X.shadowBlur=8;
        rr(X,o.x,o.y+3,o.w,o.h-3,4);X.fill();
        // spike tip
        X.fillStyle=o.color;
        X.beginPath();X.moveTo(o.x+o.w/2,o.y);X.lineTo(o.x+2,o.y+6);X.lineTo(o.x+o.w-2,o.y+6);X.closePath();X.fill();
        X.shadowBlur=0;X.restore();
    } else {
        X.save();X.shadowColor=o.color+'88';X.shadowBlur=6;
        rr(X,o.x,o.y,o.w,o.h,4);X.fill();
        X.shadowBlur=0;X.restore();
        // glint
        X.fillStyle='rgba(255,255,255,0.15)';rr(X,o.x+2,o.y+2,o.w-4,5,2);X.fill();
    }
}

function drawSlime(m){
    const bOff=Math.sin(m.bounce)*4;
    X.save();X.shadowColor=m.color;X.shadowBlur=8;
    // body (squish when bouncing)
    const sq=1+Math.abs(Math.sin(m.bounce))*0.15;
    X.scale(1/sq,sq);
    X.fillStyle=m.color;
    X.beginPath();
    X.ellipse((m.x+m.w/2)*sq,(m.y+m.h*0.6)/sq,m.w/2*sq,m.h/2,0,0,Math.PI*2);X.fill();
    // eyes
    X.fillStyle='#fff';
    X.beginPath();X.arc((m.x+8)*sq,(m.y+8)/sq,4,0,Math.PI*2);X.fill();
    X.beginPath();X.arc((m.x+20)*sq,(m.y+8)/sq,4,0,Math.PI*2);X.fill();
    X.fillStyle='#1E293B';
    X.beginPath();X.arc((m.x+9)*sq,(m.y+8)/sq,2,0,Math.PI*2);X.fill();
    X.beginPath();X.arc((m.x+21)*sq,(m.y+8)/sq,2,0,Math.PI*2);X.fill();
    X.shadowBlur=0;X.restore();
}

function drawBat(m){
    const wing=Math.sin(m.osc*0.18)*8;
    X.save();X.shadowColor=m.color;X.shadowBlur=10;
    X.fillStyle=m.color;
    // wings
    X.beginPath();X.ellipse(m.x+m.w/2-10,m.y+m.h/2+wing,12,6,Math.PI/6,0,Math.PI*2);X.fill();
    X.beginPath();X.ellipse(m.x+m.w/2+10,m.y+m.h/2+wing,12,6,-Math.PI/6,0,Math.PI*2);X.fill();
    // body
    X.fillStyle='#7C3AED';
    X.beginPath();X.ellipse(m.x+m.w/2,m.y+m.h/2,7,9,0,0,Math.PI*2);X.fill();
    // eyes
    X.fillStyle='#F87171';
    X.beginPath();X.arc(m.x+m.w/2-3,m.y+m.h/2-2,2,0,Math.PI*2);X.fill();
    X.beginPath();X.arc(m.x+m.w/2+3,m.y+m.h/2-2,2,0,Math.PI*2);X.fill();
    X.shadowBlur=0;X.restore();
}

function drawPlayer(){
    X.save();
    const cx=P.x+P.w/2, cy=P.y+P.h/2;
    X.translate(cx,cy);
    if(P.flipping||!P.grounded) X.rotate(P.angle);
    X.scale(P.squashX,P.squashY);
    // body gradient
    const pg=X.createLinearGradient(-P.w/2,-P.h/2,P.w/2,P.h/2);
    pg.addColorStop(0,'#FF6B6B');pg.addColorStop(1,'#FF8E53');
    X.fillStyle=pg;
    rr(X,-P.w/2,-P.h/2,P.w,P.h,7);X.fill();
    // double-jump glow
    if(P.jumpsLeft===0&&!P.grounded){
        X.shadowColor='#FBBF24';X.shadowBlur=14;
        X.strokeStyle='#FBBF24';X.lineWidth=2;
        rr(X,-P.w/2,-P.h/2,P.w,P.h,7);X.stroke();
        X.shadowBlur=0;
    }
    // face
    X.fillStyle='#fff';X.beginPath();X.arc(-5,-3,4,0,Math.PI*2);X.fill();
    X.beginPath();X.arc(5,-3,4,0,Math.PI*2);X.fill();
    X.fillStyle='#1E293B';X.beginPath();X.arc(-5,-3,2,0,Math.PI*2);X.fill();
    X.beginPath();X.arc(5,-3,2,0,Math.PI*2);X.fill();
    X.strokeStyle='#1E293B';X.lineWidth=1.5;X.lineCap='round';
    X.beginPath();X.arc(0,5,3,0.1*Math.PI,0.9*Math.PI);X.stroke();
    X.restore();
}

// ── Main draw ────────────────────────────────────────────────
function draw(){
    // Background
    X.fillStyle='#0F172A';X.fillRect(0,0,W,H);
    // Stars
    X.fillStyle='rgba(255,255,255,0.35)';
    for(let i=0;i<18;i++){
        const sx=((i*137+frame*0.18)%W);
        const sy=20+((i*91)%70);
        X.fillRect(sx,sy,1,1);
    }
    // Ground gradient
    const gr=X.createLinearGradient(0,GY,0,H);
    gr.addColorStop(0,'#1E293B');gr.addColorStop(1,'#0F172A');
    X.fillStyle=gr;X.fillRect(0,GY,W,H-GY);
    X.strokeStyle='#334155';X.lineWidth=1;
    X.beginPath();X.moveTo(0,GY);X.lineTo(W,GY);X.stroke();

    // Particles
    particles=particles.filter(p=>p.life>0);
    for(const p of particles){
        p.x+=p.vx;p.y+=p.vy;p.vy+=0.15;p.life-=0.025;
        if(p.life>0){X.globalAlpha=p.life;X.fillStyle=p.color;X.beginPath();X.arc(p.x,p.y,Math.max(0.1,p.r*p.life),0,Math.PI*2);X.fill();}
    }
    X.globalAlpha=1;

    // Obstacles
    for(const o of obstacles) drawObstacle(o);

    // Monsters
    for(const m of monsters){
        if(!m.alive){
            // death explosion — just particles, skip drawing body
            continue;
        }
        if(m.kind==='slime') drawSlime(m);
        else drawBat(m);
    }

    // Player
    drawPlayer();

    // Game over overlay
    if(state==='dead'){
        X.fillStyle='rgba(15,23,42,0.82)';X.fillRect(0,0,W,H);
        X.fillStyle='#F1F5F9';X.font='bold 24px sans-serif';X.textAlign='center';
        X.fillText('💥 Game Over! Score: '+score,W/2,H/2-16);
        if(score>=hiScore&&score>0){
            X.fillStyle='#FBBF24';X.font='bold 13px sans-serif';
            X.fillText('🏆 New Best!',W/2,H/2+8);
        }
        X.fillStyle='#94A3B8';X.font='14px sans-serif';
        X.fillText('Space or click → Play again',W/2,H/2+30);
    }
}

// ── Hit check ────────────────────────────────────────────────
function hits(a,b,pad){
    pad=pad||5;
    return a.x+pad<b.x+b.w-pad&&a.x+a.w-pad>b.x+pad&&
           a.y+pad<b.y+b.h-pad&&a.y+a.h-pad>b.y+pad;
}

// ── Update ───────────────────────────────────────────────────
function update(){
    if(state!=='playing') return;
    frame++;
    // Score-based smooth speed curve: starts at 4.2, soft-caps around 11
    speed = 4.2 + 0.65 * Math.sqrt(score);

    // Player physics
    P.vy+=GRAVITY; P.y+=P.vy;
    if(P.y+P.h>=GY){
        P.y=GY-P.h;
        if(!P.grounded){P.squashX=1.25;P.squashY=0.75;spawnParticles(P.x+P.w/2,GY,3);}
        P.vy=0;P.grounded=true;P.jumpsLeft=MAX_JUMPS;P.flipping=false;P.angle=0;
    }
    // Rotation while flipping in air
    if(!P.grounded){
        if(P.flipping) P.angle+=0.25;  // spin on double jump
    }
    P.squashX+=(1-P.squashX)*0.18;
    P.squashY+=(1-P.squashY)*0.18;

    // Spawn obstacles — interval shrinks with score (from 90 down to 38 frames)
    const obsInterval = Math.max(38, Math.round(90 - score * 0.9));
    if(frame % obsInterval === 0) spawnObstacle();

    // Spawn monsters — appear starting from score 5, more frequent as score grows
    const monInterval = Math.max(140, Math.round(350 - score * 3));
    if(score >= 5 && frame % monInterval === 0 && Math.random() < 0.65) spawnMonster();

    // Update & check obstacles
    for(let i=obstacles.length-1;i>=0;i--){
        obstacles[i].x-=speed;
        if(hits(P,obstacles[i])){
            die();return;
        }
        if(obstacles[i].x+obstacles[i].w<0){obstacles.splice(i,1);score++;updateScore();}
    }

    // Update & check monsters
    for(let i=monsters.length-1;i>=0;i--){
        const m=monsters[i];
        if(!m.alive){
            monsters.splice(i,1);continue;
        }
        m.x-=speed*(m.kind==='bat'?1.05:0.9);
        if(m.kind==='slime'){
            m.bounce+=0.18;
            m.y=GY-m.h+Math.abs(Math.sin(m.bounce))*(-8);  // small hop
        } else {
            m.osc++;
            m.y=m.baseY+Math.sin(m.osc*0.06)*18;  // vertical oscillation
        }
        if(hits(P,m)){
            die();return;
        }
        if(m.x+m.w<0) monsters.splice(i,1);
    }
}

function die(){
    state='dead';
    if(score>hiScore){hiScore=score;document.getElementById('hi').textContent=' BEST: '+hiScore;}
    spawnParticles(P.x+P.w/2,P.y+P.h/2,16,['#FF6B6B','#FBBF24','#F59E0B']);
    draw();
}

function updateScore(){
    document.getElementById('sc').textContent=score;
}

// ── Jump ─────────────────────────────────────────────────────
function jump(){
    if(state!=='playing') return;
    if(P.jumpsLeft>0){
        const isDouble=!P.grounded;
        P.vy=isDouble?JUMP2:JUMP1;
        P.grounded=false;
        P.jumpsLeft--;
        P.squashY=0.7;P.squashX=1.25;
        if(isDouble){
            // double jump: trigger flip + golden burst
            P.flipping=true;
            spawnParticles(P.x+P.w/2,P.y+P.h/2,8,['#FBBF24','#FCD34D','#F59E0B','#fff']);
        } else {
            spawnParticles(P.x+P.w/2,GY,4);
        }
    }
}

// ── Restart ──────────────────────────────────────────────────
function restart(){
    score=0;frame=0;speed=4.2;
    obstacles=[];monsters=[];particles=[];
    P.y=GY-P.h;P.vy=0;P.grounded=true;P.jumpsLeft=MAX_JUMPS;
    P.squashX=1;P.squashY=1;P.angle=0;P.flipping=false;
    state='playing';
    updateScore();
}

// ── Game loop ────────────────────────────────────────────────
function gameLoop(){update();draw();requestAnimationFrame(gameLoop);}

// ── Input ────────────────────────────────────────────────────
document.addEventListener('keydown',function(e){
    if(e.code==='Space'){e.preventDefault();if(state==='dead')restart();else jump();}
    if(e.code==='ArrowUp'){e.preventDefault();if(state==='dead')restart();else jump();}
});
C.addEventListener('click',function(){if(state==='dead')restart();else jump();});

gameLoop();
</script></body></html>`;
}

module.exports = { getRunnerHTML };
