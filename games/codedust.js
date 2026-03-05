/**
 * 🧹 Code Dust — Kazı-Kazan / Scratch-off oyunu
 * VS Code editor background rengiyle kaplı ekranı
 * fare hareketiyle silerek gizli görseli ortaya çıkar.
 * destination-out canvas tekniği, idle'da sıfır CPU.
 */

function getCodeDustHTML(nonce) {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{background:#0F172A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#E2E8F0;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;overflow:hidden;user-select:none;}
.topbar{display:flex;align-items:center;justify-content:space-between;width:100%;max-width:520px;padding:8px 4px;margin-bottom:8px;}
.topbar .title{font-size:14px;font-weight:600;color:#64748B;}
.score{font-size:18px;font-weight:800;}
.change-btn{font-size:12px;font-weight:600;color:#818CF8;cursor:pointer;padding:4px 12px;border-radius:6px;border:1px solid #334155;background:#1E293B;transition:all .2s;letter-spacing:.3px;}
.change-btn:hover{background:#334155;color:#A5B4FC;border-color:#818CF8;}
.wrap{position:relative;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.4);border:1px solid #334155;}
canvas{display:block;}
.hint{margin-top:10px;font-size:11px;color:#475569;font-weight:500;}
#banner{position:fixed;top:0;left:0;right:0;padding:12px;background:linear-gradient(135deg,#6366F1,#8B5CF6);color:white;text-align:center;font-size:13px;font-weight:700;transform:translateY(-100%);transition:transform .5s cubic-bezier(.68,-.55,.265,1.55);z-index:100;}
#banner.visible{transform:translateY(0);}
.prog-wrap{width:500px;height:8px;background:#1E293B;border-radius:4px;margin-top:10px;overflow:hidden;box-shadow:0 0 12px rgba(99,102,241,.2);}
.prog-bar{height:100%;width:0%;background:linear-gradient(90deg,#6366F1,#EC4899,#F59E0B,#10B981);border-radius:4px;transition:width .15s ease;}
.pct-label{margin-top:6px;font-size:12px;color:#64748B;font-weight:600;letter-spacing:.3px;min-height:18px;}
.done-overlay{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(15,23,42,.55);backdrop-filter:blur(2px);opacity:0;pointer-events:none;transition:opacity .6s;border-radius:12px;}
.done-overlay.show{opacity:1;pointer-events:auto;}
.done-text{font-size:26px;font-weight:800;background:linear-gradient(135deg,#F59E0B,#EC4899,#6366F1);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:6px;}
.done-sub{font-size:13px;color:#94A3B8;margin-bottom:16px;}
.replay-btn{font-size:13px;font-weight:700;color:#fff;background:linear-gradient(135deg,#6366F1,#EC4899);border:none;border-radius:8px;padding:8px 22px;cursor:pointer;box-shadow:0 0 18px rgba(99,102,241,.5);transition:transform .15s,box-shadow .15s;}
.replay-btn:hover{transform:scale(1.05);box-shadow:0 0 28px rgba(236,72,153,.6);}
</style></head><body>
<div id="banner">✨ AI Cevabı Hazır!</div>
<div class="topbar">
    <span class="title">🧹 CODE DUST</span>
    <span class="score" id="sc" style="color:#EC4899">0%</span>
    <button class="change-btn" id="changeBtn">🎮 Change Game</button>
</div>
<div class="wrap" style="position:relative;width:500px;height:310px;">
  <canvas id="bgC" width="500" height="310" style="position:absolute;top:0;left:0;display:block;"></canvas>
  <canvas id="dirtC" width="500" height="310" style="position:absolute;top:0;left:0;display:block;cursor:crosshair;"></canvas>
  <div class="done-overlay" id="doneOverlay">
    <div class="done-text">🎨 Mükemmel!</div>
    <div class="done-sub">Yüzey %100 temizlendi!</div>
    <button class="replay-btn" id="replayBtn">Tekrar Oyna</button>
  </div>
</div>
<div class="prog-wrap"><div class="prog-bar" id="pbar"></div></div>
<p class="pct-label" id="pctLabel">🖌️ Fareyle yüzeyi temizleyin…</p>
<div class="hint">FARE SÜRÜKLE → Temizle | ESC → Kapat</div>
<script nonce="${nonce}">
const vscode=acquireVsCodeApi();
window.addEventListener('message',e=>{if(e.data.type==='aiResponseComplete')document.getElementById('banner').classList.add('visible');});
document.addEventListener('keydown',e=>{if(e.code==='Escape'){e.preventDefault();vscode.postMessage({type:'closeGame'});}});
document.getElementById('changeBtn').addEventListener('click',()=>{vscode.postMessage({type:'changeGame'});});
document.getElementById('replayBtn').addEventListener('click',()=>{resetGame();});

const W=500,H=310;
const bgC=document.getElementById('bgC'),bgX=bgC.getContext('2d');
const dirtC=document.getElementById('dirtC'),dX=dirtC.getContext('2d');

function drawHiddenScene(){
    const base=bgX.createLinearGradient(0,0,W,H);
    base.addColorStop(0,'#0D0221');base.addColorStop(0.35,'#0F172A');base.addColorStop(0.7,'#130B2B');base.addColorStop(1,'#0D1117');
    bgX.fillStyle=base;bgX.fillRect(0,0,W,H);
    [{x:70,y:80,r:130,c1:'rgba(99,102,241,0.75)',c2:'rgba(99,102,241,0)'},{x:420,y:70,r:110,c1:'rgba(236,72,153,0.75)',c2:'rgba(236,72,153,0)'},{x:255,y:175,r:145,c1:'rgba(245,158,11,0.55)',c2:'rgba(245,158,11,0)'},{x:55,y:270,r:95,c1:'rgba(6,182,212,0.65)',c2:'rgba(6,182,212,0)'},{x:460,y:255,r:105,c1:'rgba(16,185,129,0.65)',c2:'rgba(16,185,129,0)'},{x:200,y:35,r:85,c1:'rgba(244,114,182,0.55)',c2:'rgba(244,114,182,0)'},{x:360,y:200,r:75,c1:'rgba(139,92,246,0.55)',c2:'rgba(139,92,246,0)'}].forEach(b=>{
        const g=bgX.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r);g.addColorStop(0,b.c1);g.addColorStop(1,b.c2);bgX.fillStyle=g;bgX.fillRect(0,0,W,H);
    });
    for(let i=0;i<140;i++){const sx=Math.random()*W,sy=Math.random()*H,sr=Math.random()*1.8+0.2,al=Math.random()*0.7+0.3;bgX.beginPath();bgX.arc(sx,sy,sr,0,Math.PI*2);bgX.fillStyle=\`rgba(255,255,255,\${al})\`;bgX.fill();}
    [{x:120,y:150},{x:380,y:100},{x:290,y:260},{x:60,y:50},{x:450,y:180}].forEach(s=>{bgX.save();bgX.translate(s.x,s.y);bgX.strokeStyle='rgba(255,255,255,0.9)';bgX.lineWidth=1.5;bgX.shadowColor='#ffffff';bgX.shadowBlur=8;bgX.beginPath();bgX.moveTo(-8,0);bgX.lineTo(8,0);bgX.stroke();bgX.beginPath();bgX.moveTo(0,-8);bgX.lineTo(0,8);bgX.stroke();bgX.restore();});
    const pts=[{x:120,y:150},{x:200,y:80},{x:310,y:120},{x:380,y:60},{x:440,y:140},{x:380,y:200},{x:290,y:240},{x:180,y:220},{x:120,y:150}];
    bgX.beginPath();bgX.strokeStyle='rgba(139,92,246,0.3)';bgX.lineWidth=1;pts.forEach((p,i)=>i===0?bgX.moveTo(p.x,p.y):bgX.lineTo(p.x,p.y));bgX.stroke();
    pts.forEach(p=>{bgX.beginPath();bgX.arc(p.x,p.y,3,0,Math.PI*2);bgX.fillStyle='rgba(139,92,246,0.8)';bgX.fill();});
    bgX.save();bgX.font='bold 72px sans-serif';bgX.textAlign='center';bgX.textBaseline='middle';bgX.globalAlpha=0.12;bgX.fillStyle='#fff';bgX.fillText('✨',W/2,H/2);bgX.restore();
}

function fillDirt(){
    // Üst katman VS Code editor background rengiyle kaplı
    const editorBg=getComputedStyle(document.body).getPropertyValue('--vscode-editor-background').trim()||'#1e1e1e';
    dX.globalCompositeOperation='source-over';
    dX.fillStyle=editorBg||'#0F172A';
    dX.fillRect(0,0,W,H);
    // Doku gürültüsü
    for(let tx=0;tx<W;tx+=3){for(let ty=0;ty<H;ty+=3){if(Math.random()>0.55){dX.fillStyle=\`rgba(\${15+Math.random()*20},\${23+Math.random()*15},\${42+Math.random()*15},\${0.3+Math.random()*0.4})\`;dX.fillRect(tx,ty,3,3);}}}
    for(let i=0;i<30;i++){const px=Math.random()*W,py=Math.random()*H,pr=15+Math.random()*40,pg=dX.createRadialGradient(px,py,0,px,py,pr);pg.addColorStop(0,\`rgba(8,12,25,\${0.3+Math.random()*0.3})\`);pg.addColorStop(1,'rgba(8,12,25,0)');dX.fillStyle=pg;dX.fillRect(px-pr,py-pr,pr*2,pr*2);}
}

let isDrawing=false,done=false,lastX=null,lastY=null;
const BRUSH=32;

function erase(x,y){
    dX.globalCompositeOperation='destination-out';
    const g=dX.createRadialGradient(x,y,0,x,y,BRUSH);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(0.55,'rgba(0,0,0,0.85)');g.addColorStop(1,'rgba(0,0,0,0)');
    dX.fillStyle=g;dX.beginPath();dX.arc(x,y,BRUSH,0,Math.PI*2);dX.fill();
    dX.globalCompositeOperation='source-over';
}

function eraseSegment(x1,y1,x2,y2){
    const dist=Math.hypot(x2-x1,y2-y1),steps=Math.max(1,Math.floor(dist/6));
    for(let i=0;i<=steps;i++){const t=i/steps;erase(x1+(x2-x1)*t,y1+(y2-y1)*t);}
}

let sampleHandle;
function startSampling(){
    sampleHandle=setInterval(()=>{
        if(done)return;
        const imgData=dX.getImageData(0,0,W,H),d=imgData.data;
        let transp=0;const step=16;
        for(let i=3;i<d.length;i+=4*step){if(d[i]<100)transp++;}
        const total=(d.length/4)/step,pct=Math.min(100,Math.round((transp/total)*100));
        document.getElementById('pbar').style.width=pct+'%';
        document.getElementById('sc').textContent=pct+'%';
        if(pct<20)document.getElementById('pctLabel').textContent='🖌️ Fareyle yüzeyi temizleyin…';
        else if(pct<45)document.getElementById('pctLabel').textContent='🔥 '+pct+'% temizlendi — devam!';
        else if(pct<70)document.getElementById('pctLabel').textContent='✨ '+pct+'% temizlendi — harika!';
        else if(pct<90)document.getElementById('pctLabel').textContent='🌟 '+pct+'% — neredeyse bitti!';
        else if(pct<100)document.getElementById('pctLabel').textContent='💫 '+pct+'% — son dokunuşlar!';
        if(pct>=92&&!done){done=true;clearInterval(sampleHandle);dX.clearRect(0,0,W,H);document.getElementById('pbar').style.width='100%';document.getElementById('sc').textContent='100%';document.getElementById('pctLabel').textContent='🎉 Mükemmel! Gizem ortaya çıktı!';setTimeout(()=>document.getElementById('doneOverlay').classList.add('show'),400);}
    },250);
}

function resetGame(){done=false;clearInterval(sampleHandle);document.getElementById('doneOverlay').classList.remove('show');document.getElementById('pbar').style.width='0%';document.getElementById('sc').textContent='0%';document.getElementById('pctLabel').textContent='🖌️ Fareyle yüzeyi temizleyin…';fillDirt();startSampling();}

dirtC.addEventListener('mousedown',()=>{isDrawing=true;lastX=null;lastY=null;});
dirtC.addEventListener('mouseup',()=>{isDrawing=false;lastX=null;lastY=null;});
dirtC.addEventListener('mouseleave',()=>{isDrawing=false;lastX=null;lastY=null;});
dirtC.addEventListener('mousemove',e=>{
    if(!isDrawing||done)return;
    const rect=dirtC.getBoundingClientRect(),x=(e.clientX-rect.left)*(W/rect.width),y=(e.clientY-rect.top)*(H/rect.height);
    if(lastX!==null)eraseSegment(lastX,lastY,x,y);else erase(x,y);
    lastX=x;lastY=y;
});

drawHiddenScene();fillDirt();startSampling();
<\/script></body></html>`;
}

module.exports = { getCodeDustHTML };
