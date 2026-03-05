/**
 * 🏃 Runner — Sonsuz koşucu oyunu
 * Space veya tıklama ile zıpla, engellerden kaç.
 */

function getRunnerHTML(nonce) {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{background:#0F172A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#E2E8F0;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;overflow:hidden;user-select:none;}
.topbar{display:flex;align-items:center;justify-content:space-between;width:100%;max-width:520px;padding:8px 4px;margin-bottom:8px;}
.topbar .title{font-size:14px;font-weight:600;color:#64748B;}
.score{font-size:24px;font-weight:800;}
.change-btn{font-size:12px;font-weight:600;color:#818CF8;cursor:pointer;padding:4px 12px;border-radius:6px;border:1px solid #334155;background:#1E293B;transition:all .2s;letter-spacing:.3px;}
.change-btn:hover{background:#334155;color:#A5B4FC;border-color:#818CF8;}
.wrap{position:relative;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.4);border:1px solid #334155;}
canvas{display:block;}
.hint{margin-top:10px;font-size:11px;color:#475569;font-weight:500;}
#banner{position:fixed;top:0;left:0;right:0;padding:12px;background:linear-gradient(135deg,#6366F1,#8B5CF6);color:white;text-align:center;font-size:13px;font-weight:700;transform:translateY(-100%);transition:transform .5s cubic-bezier(.68,-.55,.265,1.55);z-index:100;}
#banner.visible{transform:translateY(0);}
</style></head><body>
<div id="banner">✨ AI Cevabı Hazır!</div>
<div class="topbar">
    <span class="title">🏃 RUNNER</span>
    <span class="score" id="sc" style="color:#FF6B6B">0</span>
    <button class="change-btn" id="changeBtn">🎮 Change Game</button>
</div>
<div class="wrap"><canvas id="c" width="500" height="300"></canvas></div>
<div class="hint">SPACE veya TIKLA → Zıpla | ESC → Kapat</div>
<script nonce="${nonce}">
const vscode=acquireVsCodeApi();
window.addEventListener('message',e=>{if(e.data.type==='aiResponseComplete')document.getElementById('banner').classList.add('visible');});
document.addEventListener('keydown',e=>{if(e.code==='Escape'){e.preventDefault();vscode.postMessage({type:'closeGame'});}});
document.getElementById('changeBtn').addEventListener('click',()=>{vscode.postMessage({type:'changeGame'});});

function rr(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();}
function shade(c,p){let R=parseInt(c.substr(1,2),16),G=parseInt(c.substr(3,2),16),B=parseInt(c.substr(5,2),16);R=Math.min(255,Math.max(0,R+Math.floor(R*p/100)));G=Math.min(255,Math.max(0,G+Math.floor(G*p/100)));B=Math.min(255,Math.max(0,B+Math.floor(B*p/100)));return'#'+R.toString(16).padStart(2,'0')+G.toString(16).padStart(2,'0')+B.toString(16).padStart(2,'0');}

const C=document.getElementById('c'),X=C.getContext('2d');
const W=500,H=300,GY=H-50;
const GRAVITY=0.6,JUMPF=-11.5;
const OBS_COLORS=['#8B5CF6','#06B6D4','#EC4899','#F59E0B','#10B981'];

let state='playing',score=0,frame=0,speed=4;
const player={x:60,y:GY-28,w:28,h:28,vy:0,grounded:true,squashX:1,squashY:1};
let obstacles=[];
let particles=[];

function spawnParticles(x,y,count){
    for(let i=0;i<count;i++){
        particles.push({x,y,vx:(Math.random()-0.5)*5,vy:-Math.random()*4-1,r:2+Math.random()*3,life:1,color:['#FF6B6B','#FF8E53','#FBBF24','#8B5CF6'][Math.floor(Math.random()*4)]});
    }
}

function draw(){
    X.fillStyle='#0F172A';X.fillRect(0,0,W,H);
    var grd=X.createLinearGradient(0,GY,0,H);grd.addColorStop(0,'#1E293B');grd.addColorStop(1,'#0F172A');X.fillStyle=grd;X.fillRect(0,GY,W,H-GY);
    X.strokeStyle='#334155';X.lineWidth=1;X.beginPath();X.moveTo(0,GY);X.lineTo(W,GY);X.stroke();

    particles=particles.filter(function(p){return p.life>0;});
    for(var i=0;i<particles.length;i++){
        var pt=particles[i];pt.x+=pt.vx;pt.y+=pt.vy;pt.vy+=0.12;pt.life-=0.03;
        if(pt.life>0){X.globalAlpha=pt.life;X.fillStyle=pt.color;X.beginPath();X.arc(pt.x,pt.y,Math.max(0.1,pt.r*pt.life),0,Math.PI*2);X.fill();}
    }
    X.globalAlpha=1;

    for(var i=0;i<obstacles.length;i++){
        var o=obstacles[i];var ogr=X.createLinearGradient(o.x,o.y,o.x+o.w,o.y+o.h);ogr.addColorStop(0,o.color);ogr.addColorStop(1,shade(o.color,-25));X.fillStyle=ogr;rr(X,o.x,o.y,o.w,o.h,5);X.fill();
    }

    X.save();var cx=player.x+player.w/2,cy=player.y+player.h/2;X.translate(cx,cy);X.scale(player.squashX,player.squashY);
    var pgr=X.createLinearGradient(-player.w/2,-player.h/2,player.w/2,player.h/2);pgr.addColorStop(0,'#FF6B6B');pgr.addColorStop(1,'#FF8E53');X.fillStyle=pgr;rr(X,-player.w/2,-player.h/2,player.w,player.h,7);X.fill();
    X.fillStyle='#fff';X.beginPath();X.arc(-5,-3,4,0,Math.PI*2);X.fill();X.beginPath();X.arc(5,-3,4,0,Math.PI*2);X.fill();
    X.fillStyle='#1E293B';X.beginPath();X.arc(-5,-3,2,0,Math.PI*2);X.fill();X.beginPath();X.arc(5,-3,2,0,Math.PI*2);X.fill();
    X.strokeStyle='#1E293B';X.lineWidth=1.5;X.lineCap='round';X.beginPath();X.arc(0,5,3,0.1*Math.PI,0.9*Math.PI);X.stroke();
    X.restore();

    if(state==='dead'){
        X.fillStyle='rgba(15,23,42,0.75)';X.fillRect(0,0,W,H);
        X.fillStyle='#F1F5F9';X.font='bold 24px sans-serif';X.textAlign='center';X.fillText('💥 Oyun Bitti! Skor: '+score,W/2,H/2-12);
        X.fillStyle='#94A3B8';X.font='14px sans-serif';X.fillText('Space veya tıkla → Tekrar oyna',W/2,H/2+18);
    }
}

function update(){
    if(state!=='playing') return;
    frame++;speed=4+Math.floor(frame/600)*0.5;
    player.vy+=GRAVITY;player.y+=player.vy;
    if(player.y+player.h>=GY){player.y=GY-player.h;if(!player.grounded){player.squashX=1.2;player.squashY=0.8;spawnParticles(player.x+player.w/2,GY,3);}player.vy=0;player.grounded=true;}
    player.squashX+=(1-player.squashX)*0.15;player.squashY+=(1-player.squashY)*0.15;
    if(frame%Math.max(35,80-Math.floor(frame/400)*4)===0){var h=22+Math.random()*28,w=16+Math.random()*18;obstacles.push({x:W+10,y:GY-h,w,h,color:OBS_COLORS[Math.floor(Math.random()*OBS_COLORS.length)]});}
    for(var i=obstacles.length-1;i>=0;i--){
        obstacles[i].x-=speed;var o=obstacles[i],pad=5;
        if(player.x+pad<o.x+o.w-pad&&player.x+player.w-pad>o.x+pad&&player.y+pad<o.y+o.h-pad&&player.y+player.h-pad>o.y+pad){state='dead';spawnParticles(player.x+player.w/2,player.y+player.h/2,12);draw();return;}
        if(o.x+o.w<0){obstacles.splice(i,1);score++;document.getElementById('sc').textContent=score;}
    }
}

function jump(){if(state==='playing'&&player.grounded){player.vy=JUMPF;player.grounded=false;player.squashY=0.75;player.squashX=1.2;spawnParticles(player.x+player.w/2,GY,4);}}
function restart(){score=0;frame=0;speed=4;obstacles=[];particles=[];player.y=GY-player.h;player.vy=0;player.grounded=true;player.squashX=1;player.squashY=1;state='playing';document.getElementById('sc').textContent='0';}
function gameLoop(){update();draw();requestAnimationFrame(gameLoop);}

document.addEventListener('keydown',function(e){if(e.code==='Space'){e.preventDefault();if(state==='dead')restart();else jump();}});
C.addEventListener('click',function(){if(state==='dead')restart();else jump();});
draw();gameLoop();
</script></body></html>`;
}

module.exports = { getRunnerHTML };
