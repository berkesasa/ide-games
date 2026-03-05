/**
 * 🧠 Memory — Color pair matching game
 * Click cards to find matching color pairs.
 */

function getMemoryHTML(nonce) {
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
</style></head><body>
<div id="banner">✨ AI Response Ready!</div>
<div class="topbar">
    <span class="title">🧠 MEMORY</span>
    <span class="score" id="sc" style="color:#8B5CF6">0 moves</span>
    <button class="change-btn" id="changeBtn">🎮 Change Game</button>
</div>
<div class="wrap"><canvas id="c" width="400" height="400"></canvas></div>
<div class="hint">CLICK CARDS → Find pairs | ESC → Close</div>
<script nonce="${nonce}">
const vscode=acquireVsCodeApi();
window.addEventListener('message',e=>{if(e.data.type==='aiResponseComplete')document.getElementById('banner').classList.add('visible');});
document.addEventListener('keydown',e=>{if(e.code==='Escape'){e.preventDefault();vscode.postMessage({type:'closeGame'});}});
document.getElementById('changeBtn').addEventListener('click',()=>{vscode.postMessage({type:'changeGame'});});

function rr(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();}

const C=document.getElementById('c'),X=C.getContext('2d');
const CC=['#FF6B6B','#FF8E53','#FBBF24','#10B981','#06B6D4','#8B5CF6','#EC4899','#6366F1'];
const COLS=4,ROWS=4,PAD=10;
const cw=(400-PAD*(COLS+1))/COLS,ch=(400-PAD*(ROWS+1))/ROWS;
let cards=[],flipped=[],matched=[],moves=0,lock=false,done=false;

function shuffle(a){for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function init(){let all=shuffle([...CC,...CC]);cards=all.map((c,i)=>({color:c,idx:i,col:i%COLS,row:Math.floor(i/COLS)}));flipped=[];matched=[];moves=0;lock=false;done=false;document.getElementById('sc').textContent='0 moves';}

function draw(){
    X.fillStyle='#0F172A';X.fillRect(0,0,400,400);
    cards.forEach(c=>{
        let x=PAD+c.col*(cw+PAD),y=PAD+c.row*(ch+PAD),fl=flipped.includes(c.idx)||matched.includes(c.idx);
        if(fl){X.fillStyle=c.color;rr(X,x,y,cw,ch,10);X.fill();X.fillStyle='rgba(255,255,255,.3)';X.beginPath();X.arc(x+cw/2,y+ch/2,15,0,Math.PI*2);X.fill();}
        else{let gr=X.createLinearGradient(x,y,x+cw,y+ch);gr.addColorStop(0,'#1E293B');gr.addColorStop(1,'#283548');X.fillStyle=gr;rr(X,x,y,cw,ch,10);X.fill();X.strokeStyle='#334155';X.lineWidth=1;rr(X,x,y,cw,ch,10);X.stroke();X.fillStyle='#475569';X.font='bold 22px sans-serif';X.textAlign='center';X.textBaseline='middle';X.fillText('?',x+cw/2,y+ch/2);}
    });
    if(done){X.fillStyle='rgba(15,23,42,.75)';X.fillRect(0,0,400,400);X.fillStyle='#F1F5F9';X.font='bold 22px sans-serif';X.textAlign='center';X.fillText('🎉 Congrats! '+moves+' moves',200,190);X.fillStyle='#94A3B8';X.font='14px sans-serif';X.fillText('Click → Play again',200,220);}
}

C.addEventListener('click',e=>{
    if(done){init();draw();return;}
    if(lock)return;
    let rect=C.getBoundingClientRect(),mx=(e.clientX-rect.left)*(400/rect.width),my=(e.clientY-rect.top)*(400/rect.height);
    let card=cards.find(c=>{let x=PAD+c.col*(cw+PAD),y=PAD+c.row*(ch+PAD);return mx>=x&&mx<=x+cw&&my>=y&&my<=y+ch;});
    if(!card||flipped.includes(card.idx)||matched.includes(card.idx))return;
    flipped.push(card.idx);draw();
    if(flipped.length===2){moves++;document.getElementById('sc').textContent=moves+' moves';lock=true;
        let[a,b]=flipped;
        if(cards[a].color===cards[b].color){matched.push(a,b);flipped=[];lock=false;draw();if(matched.length===cards.length){done=true;draw();}}
        else{setTimeout(()=>{flipped=[];lock=false;draw();},700);}
    }
});

init();draw();
</script></body></html>`;
}

module.exports = { getMemoryHTML };
