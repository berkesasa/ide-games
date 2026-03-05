const vscode = require('vscode');
const { get2048HTML } = require('./games/game2048');

let gamePanel = null;
let closeTimeout = null;
let statusBarItem;

function activate(context) {
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(game) 🎮 IDE Games";
    statusBarItem.tooltip = "Mini oyun koleksiyonunu aç/kapat";
    statusBarItem.command = 'ideGames.open';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    try {
        if (vscode.chat && typeof vscode.chat.createChatParticipant === 'function') {
            const participant = vscode.chat.createChatParticipant('ide-games.games', chatHandler);
            participant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'icon.png');
            context.subscriptions.push(participant);
        }
    } catch (e) { }

    context.subscriptions.push(
        vscode.commands.registerCommand('ideGames.open', () => showGamePicker())
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('ideGames.close', () => closeGamePanel(0))
    );
}

async function showGamePicker() {
    if (gamePanel) { closeGamePanel(0); }

    const pick = await vscode.window.showQuickPick([
        { label: '🔢 2048', description: 'Kaydır, birleştir, 2048\'e ulaş!', game: '2048' },
        { label: '🏃 Runner', description: 'Zıpla ve engellerden kaç', game: 'runner' },
        { label: '🧹 Code Dust', description: 'Kazı-Kazan: gizli görseli ortaya çıkar', game: 'tilecleaner' },
        { label: '🧠 Memory', description: 'Renk çiftlerini eşleştir', game: 'memory' },
    ], { placeHolder: '🎮 Hangi oyunu oynamak istersin?', title: 'IDE Games' });

    if (pick) createGamePanel(pick.game);
}

async function chatHandler(request, context, stream, token) {
    // LLM işlemi başlamadan önce QuickPick ile oyun seçtir
    await showGamePicker();

    stream.markdown('🎮 **IDE Games!** AI çalışırken oyunun tadını çıkarın.\n\n');
    try {
        const allModels = await vscode.lm.selectChatModels();
        const model = allModels?.[0];
        if (model) {
            const msgs = [vscode.LanguageModelChatMessage.User(request.prompt)];
            const resp = await model.sendRequest(msgs, {}, token);
            for await (const f of resp.text) stream.markdown(f);
        } else {
            stream.markdown('AI modeli bulunamadı, ama oyunun tadını çıkarın! 🎯');
        }
    } catch (e) { stream.markdown('Oyuna devam! 🕹️'); }

    // Yanıt bittiğinde paneli uygun bir uyarı ile 3 saniye sonra kapatır
    closeGamePanel(3000);
    return { metadata: { command: 'games' } };
}

function getNonce() {
    let t = '';
    const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) t += c.charAt(Math.floor(Math.random() * c.length));
    return t;
}

function createGamePanel(gameName) {
    if (gamePanel) { gamePanel.dispose(); gamePanel = null; }
    if (closeTimeout) { clearTimeout(closeTimeout); closeTimeout = null; }

    const titles = {
        '2048': '🔢 2048',
        runner: '🏃 Runner',
        tilecleaner: '🧹 Code Dust',
        memory: '🧠 Memory',
    };
    gamePanel = vscode.window.createWebviewPanel(
        'ideGames', titles[gameName] || '🎮 IDE Games',
        vscode.ViewColumn.One,
        { enableScripts: true, retainContextWhenHidden: true }
    );

    const nonce = getNonce();
    const htmlMap = {
        '2048': get2048HTML,
        runner: getRunnerHTML,
        tilecleaner: getTileCleanerHTML,
        memory: getMemoryHTML,
    };
    gamePanel.webview.html = (htmlMap[gameName] || htmlMap.runner)(nonce);

    // Webview'den gelen mesajları dinle
    gamePanel.webview.onDidReceiveMessage(msg => {
        if (msg.type === 'closeGame') {
            closeGamePanel(0);
        } else if (msg.type === 'changeGame') {
            closeGamePanel(0);
            setTimeout(() => showGamePicker(), 100);
        }
    });

    gamePanel.onDidDispose(() => {
        gamePanel = null;
        if (closeTimeout) { clearTimeout(closeTimeout); closeTimeout = null; }
    });
}

function closeGamePanel(delay) {
    if (!gamePanel) return;
    try { gamePanel.webview.postMessage({ type: 'aiResponseComplete' }); } catch (e) { }
    if (closeTimeout) clearTimeout(closeTimeout);
    closeTimeout = setTimeout(() => {
        if (gamePanel) { gamePanel.dispose(); gamePanel = null; }
        closeTimeout = null;
    }, delay);
}

// ============================================================
// ORTAK YARDIMCILAR
// ============================================================
function baseCSS() {
    return `
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
`;
}

function baseScript() {
    return `
const vscode=acquireVsCodeApi();
window.addEventListener('message',e=>{if(e.data.type==='aiResponseComplete')document.getElementById('banner').classList.add('visible');});
document.addEventListener('keydown',e=>{if(e.code==='Escape'){e.preventDefault();vscode.postMessage({type:'closeGame'});}});
document.getElementById('changeBtn').addEventListener('click',()=>{vscode.postMessage({type:'changeGame'});});
`;
}

function rrFunc() {
    return `
function rr(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();}
function shade(c,p){let R=parseInt(c.substr(1,2),16),G=parseInt(c.substr(3,2),16),B=parseInt(c.substr(5,2),16);R=Math.min(255,Math.max(0,R+Math.floor(R*p/100)));G=Math.min(255,Math.max(0,G+Math.floor(G*p/100)));B=Math.min(255,Math.max(0,B+Math.floor(B*p/100)));return'#'+R.toString(16).padStart(2,'0')+G.toString(16).padStart(2,'0')+B.toString(16).padStart(2,'0');}
`;
}

function topbarHTML(emoji, name, scoreId, scoreColor) {
    return `
<div class="topbar">
    <span class="title">${emoji} ${name}</span>
    <span class="score" id="${scoreId}" style="color:${scoreColor}">0</span>
    <button class="change-btn" id="changeBtn">🎮 Change Game</button>
</div>`;
}

function wrapHTML(nonce, canvasW, canvasH, hint, gameScript) {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
<style>${baseCSS()}</style></head><body>
<div id="banner">✨ AI Cevabı Hazır!</div>`;
}

// ============================================================
// 🏃 RUNNER (orijinal referans versiyon)
// ============================================================
function getRunnerHTML(nonce) {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
<style>${baseCSS()}</style></head><body>
<div id="banner">✨ AI Cevabı Hazır!</div>
${topbarHTML('🏃', 'RUNNER', 'sc', '#FF6B6B')}
<div class="wrap"><canvas id="c" width="500" height="300"></canvas></div>
<div class="hint">SPACE veya TIKLA → Zıpla | ESC → Kapat</div>
<script nonce="${nonce}">
${baseScript()}
${rrFunc()}
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
        particles.push({
            x:x,y:y,
            vx:(Math.random()-0.5)*5,
            vy:-Math.random()*4-1,
            r:2+Math.random()*3,
            life:1,
            color:['#FF6B6B','#FF8E53','#FBBF24','#8B5CF6'][Math.floor(Math.random()*4)]
        });
    }
}

function draw(){
    // Arka plan
    X.fillStyle='#0F172A';
    X.fillRect(0,0,W,H);

    // Zemin
    var grd=X.createLinearGradient(0,GY,0,H);
    grd.addColorStop(0,'#1E293B');
    grd.addColorStop(1,'#0F172A');
    X.fillStyle=grd;
    X.fillRect(0,GY,W,H-GY);
    X.strokeStyle='#334155';
    X.lineWidth=1;
    X.beginPath();
    X.moveTo(0,GY);
    X.lineTo(W,GY);
    X.stroke();

    // Parçacıklar
    particles=particles.filter(function(p){return p.life>0;});
    for(var i=0;i<particles.length;i++){
        var pt=particles[i];
        pt.x+=pt.vx;
        pt.y+=pt.vy;
        pt.vy+=0.12;
        pt.life-=0.03;
        if(pt.life>0){
            X.globalAlpha=pt.life;
            X.fillStyle=pt.color;
            X.beginPath();
            X.arc(pt.x,pt.y,Math.max(0.1, pt.r*pt.life),0,Math.PI*2);
            X.fill();
        }
    }
    X.globalAlpha=1;

    // Engeller
    for(var i=0;i<obstacles.length;i++){
        var o=obstacles[i];
        var ogr=X.createLinearGradient(o.x,o.y,o.x+o.w,o.y+o.h);
        ogr.addColorStop(0,o.color);
        ogr.addColorStop(1,shade(o.color,-25));
        X.fillStyle=ogr;
        rr(X,o.x,o.y,o.w,o.h,5);
        X.fill();
    }

    // Oyuncu
    X.save();
    var cx=player.x+player.w/2;
    var cy=player.y+player.h/2;
    X.translate(cx,cy);
    X.scale(player.squashX,player.squashY);

    // Gövde
    var pgr=X.createLinearGradient(-player.w/2,-player.h/2,player.w/2,player.h/2);
    pgr.addColorStop(0,'#FF6B6B');
    pgr.addColorStop(1,'#FF8E53');
    X.fillStyle=pgr;
    rr(X,-player.w/2,-player.h/2,player.w,player.h,7);
    X.fill();

    // Gözler (beyaz)
    X.fillStyle='#fff';
    X.beginPath();X.arc(-5,-3,4,0,Math.PI*2);X.fill();
    X.beginPath();X.arc(5,-3,4,0,Math.PI*2);X.fill();

    // Gözbebekleri
    X.fillStyle='#1E293B';
    X.beginPath();X.arc(-5,-3,2,0,Math.PI*2);X.fill();
    X.beginPath();X.arc(5,-3,2,0,Math.PI*2);X.fill();

    // Ağız
    X.strokeStyle='#1E293B';
    X.lineWidth=1.5;
    X.lineCap='round';
    X.beginPath();
    X.arc(0,5,3,0.1*Math.PI,0.9*Math.PI);
    X.stroke();

    X.restore();

    // Game Over ekranı
    if(state==='dead'){
        X.fillStyle='rgba(15,23,42,0.75)';
        X.fillRect(0,0,W,H);
        X.fillStyle='#F1F5F9';
        X.font='bold 24px sans-serif';
        X.textAlign='center';
        X.fillText('\\ud83d\\udca5 Oyun Bitti! Skor: '+score,W/2,H/2-12);
        X.fillStyle='#94A3B8';
        X.font='14px sans-serif';
        X.fillText('Space veya t\\u0131kla \\u2192 Tekrar oyna',W/2,H/2+18);
    }
}

function update(){
    if(state!=='playing') return;

    frame++;
    speed=4+Math.floor(frame/600)*0.5;

    // Fizik
    player.vy+=GRAVITY;
    player.y+=player.vy;

    // Zemin çarpışma
    if(player.y+player.h>=GY){
        player.y=GY-player.h;
        if(!player.grounded){
            player.squashX=1.2;
            player.squashY=0.8;
            spawnParticles(player.x+player.w/2,GY,3);
        }
        player.vy=0;
        player.grounded=true;
    }

    // Squash/stretch yumuşatma
    player.squashX+=(1-player.squashX)*0.15;
    player.squashY+=(1-player.squashY)*0.15;

    // Engel üretimi
    if(frame%Math.max(35,80-Math.floor(frame/400)*4)===0){
        var h=22+Math.random()*28;
        var w=16+Math.random()*18;
        obstacles.push({
            x:W+10,
            y:GY-h,
            w:w,
            h:h,
            color:OBS_COLORS[Math.floor(Math.random()*OBS_COLORS.length)]
        });
    }

    // Engel hareketi ve çarpışma
    for(var i=obstacles.length-1;i>=0;i--){
        obstacles[i].x-=speed;
        var o=obstacles[i];
        var pad=5;
        // Çarpışma kontrolü
        if(player.x+pad<o.x+o.w-pad && player.x+player.w-pad>o.x+pad &&
           player.y+pad<o.y+o.h-pad && player.y+player.h-pad>o.y+pad){
            state='dead';
            spawnParticles(player.x+player.w/2,player.y+player.h/2,12);
            draw();
            return;
        }
        // Geçiş skoru
        if(o.x+o.w<0){
            obstacles.splice(i,1);
            score++;
            document.getElementById('sc').textContent=score;
        }
    }
}

function jump(){
    if(state==='playing' && player.grounded){
        player.vy=JUMPF;
        player.grounded=false;
        player.squashY=0.75;
        player.squashX=1.2;
        spawnParticles(player.x+player.w/2,GY,4);
    }
}

function restart(){
    score=0;frame=0;speed=4;
    obstacles=[];particles=[];
    player.y=GY-player.h;
    player.vy=0;
    player.grounded=true;
    player.squashX=1;
    player.squashY=1;
    state='playing';
    document.getElementById('sc').textContent='0';
}

function gameLoop(){
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown',function(e){
    if(e.code==='Space'){
        e.preventDefault();
        if(state==='dead') restart();
        else jump();
    }
});

C.addEventListener('click',function(){
    if(state==='dead') restart();
    else jump();
});

draw();
gameLoop();
</script></body></html>`;
}

// ============================================================
// 🐍 SNAKE
// ============================================================
function getSnakeHTML(nonce) {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
<style>${baseCSS()}</style></head><body>
<div id="banner">✨ AI Cevabı Hazır!</div>
${topbarHTML('🐍', 'SNAKE', 'sc', '#10B981')}
<div class="wrap"><canvas id="c" width="400" height="400"></canvas></div>
<div class="hint">OK TUŞLARI veya WASD → Yön ver | ESC → Kapat</div>
<script nonce="${nonce}">
${baseScript()}
${rrFunc()}
const C=document.getElementById('c'),X=C.getContext('2d');
const SZ=20,CO=20,RO=20;
let st='playing',score=0,snake,dir,food,intv,nextDir;
function placeFood(){do{food={x:Math.floor(Math.random()*CO),y:Math.floor(Math.random()*RO)};}while(snake.some(s=>s.x===food.x&&s.y===food.y));}
function reset(){score=0;snake=[{x:10,y:10},{x:9,y:10},{x:8,y:10}];dir={x:1,y:0};nextDir={x:1,y:0};placeFood();document.getElementById('sc').textContent='0';}
function draw(){
    X.fillStyle='#0F172A';X.fillRect(0,0,400,400);
    X.strokeStyle='#1E293B';X.lineWidth=.5;
    for(let i=0;i<=CO;i++){X.beginPath();X.moveTo(i*SZ,0);X.lineTo(i*SZ,400);X.stroke();}
    for(let i=0;i<=RO;i++){X.beginPath();X.moveTo(0,i*SZ);X.lineTo(400,i*SZ);X.stroke();}
    if(food){X.fillStyle='#F472B6';X.beginPath();X.arc(food.x*SZ+SZ/2,food.y*SZ+SZ/2,SZ/2-2,0,Math.PI*2);X.fill();X.fillStyle='#FCA5D3';X.beginPath();X.arc(food.x*SZ+SZ/2-2,food.y*SZ+SZ/2-2,3,0,Math.PI*2);X.fill();}
    snake.forEach((s,i)=>{X.fillStyle=i===0?'#10B981':'rgba(16,185,129,'+(0.9-i/snake.length*0.4)+')';rr(X,s.x*SZ+1,s.y*SZ+1,SZ-2,SZ-2,4);X.fill();});
    if(snake.length){let h=snake[0];X.fillStyle='#fff';X.beginPath();X.arc(h.x*SZ+7,h.y*SZ+7,3,0,Math.PI*2);X.fill();X.beginPath();X.arc(h.x*SZ+13,h.y*SZ+7,3,0,Math.PI*2);X.fill();X.fillStyle='#064E3B';X.beginPath();X.arc(h.x*SZ+7,h.y*SZ+7,1.5,0,Math.PI*2);X.fill();X.beginPath();X.arc(h.x*SZ+13,h.y*SZ+7,1.5,0,Math.PI*2);X.fill();}
    if(st==='dead'){X.fillStyle='rgba(15,23,42,.75)';X.fillRect(0,0,400,400);X.fillStyle='#F1F5F9';X.font='bold 22px sans-serif';X.textAlign='center';X.fillText('💀 Oyun Bitti! Skor: '+score,200,190);X.fillStyle='#94A3B8';X.font='14px sans-serif';X.fillText('Herhangi bir tuşa bas → Tekrar',200,220);}
}
function tick(){
    if(st!=='playing')return;
    dir=nextDir;let h={x:snake[0].x+dir.x,y:snake[0].y+dir.y};
    if(h.x<0||h.x>=CO||h.y<0||h.y>=RO||snake.some(s=>s.x===h.x&&s.y===h.y)){st='dead';clearInterval(intv);intv=null;draw();return;}
    snake.unshift(h);
    if(h.x===food.x&&h.y===food.y){score++;document.getElementById('sc').textContent=score;placeFood();}else{snake.pop();}
    draw();
}
function restart(){reset();st='playing';draw();if(intv)clearInterval(intv);intv=setInterval(tick,120);}
reset();draw();intv=setInterval(tick,120);
document.addEventListener('keydown',e=>{
    if(st==='dead'&&e.code!=='Escape'){restart();return;}
    const m={ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1},ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0},KeyW:{x:0,y:-1},KeyS:{x:0,y:1},KeyA:{x:-1,y:0},KeyD:{x:1,y:0}};
    const d=m[e.code];if(d&&!(d.x===-dir.x&&d.y===-dir.y)){nextDir=d;e.preventDefault();}
});
</script></body></html>`;
}

// ============================================================
// 🧠 MEMORY
// ============================================================
function getMemoryHTML(nonce) {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
<style>${baseCSS()}</style></head><body>
<div id="banner">✨ AI Cevabı Hazır!</div>
${topbarHTML('🧠', 'MEMORY', 'sc', '#8B5CF6')}
<div class="wrap"><canvas id="c" width="400" height="400"></canvas></div>
<div class="hint">KARTLARA TIKLA → Çiftleri bul | ESC → Kapat</div>
<script nonce="${nonce}">
${baseScript()}
${rrFunc()}
const C=document.getElementById('c'),X=C.getContext('2d');
const CC=['#FF6B6B','#FF8E53','#FBBF24','#10B981','#06B6D4','#8B5CF6','#EC4899','#6366F1'];
const COLS=4,ROWS=4,PAD=10;
const cw=(400-PAD*(COLS+1))/COLS,ch=(400-PAD*(ROWS+1))/ROWS;
let cards=[],flipped=[],matched=[],moves=0,lock=false,done=false;
function shuffle(a){for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function init(){let all=shuffle([...CC,...CC]);cards=all.map((c,i)=>({color:c,idx:i,col:i%COLS,row:Math.floor(i/COLS)}));flipped=[];matched=[];moves=0;lock=false;done=false;document.getElementById('sc').textContent='0 hamle';}
function draw(){
    X.fillStyle='#0F172A';X.fillRect(0,0,400,400);
    cards.forEach(c=>{
        let x=PAD+c.col*(cw+PAD),y=PAD+c.row*(ch+PAD),fl=flipped.includes(c.idx)||matched.includes(c.idx);
        if(fl){X.fillStyle=c.color;rr(X,x,y,cw,ch,10);X.fill();X.fillStyle='rgba(255,255,255,.3)';X.beginPath();X.arc(x+cw/2,y+ch/2,15,0,Math.PI*2);X.fill();}
        else{let gr=X.createLinearGradient(x,y,x+cw,y+ch);gr.addColorStop(0,'#1E293B');gr.addColorStop(1,'#283548');X.fillStyle=gr;rr(X,x,y,cw,ch,10);X.fill();X.strokeStyle='#334155';X.lineWidth=1;rr(X,x,y,cw,ch,10);X.stroke();X.fillStyle='#475569';X.font='bold 22px sans-serif';X.textAlign='center';X.textBaseline='middle';X.fillText('?',x+cw/2,y+ch/2);}
    });
    if(done){X.fillStyle='rgba(15,23,42,.75)';X.fillRect(0,0,400,400);X.fillStyle='#F1F5F9';X.font='bold 22px sans-serif';X.textAlign='center';X.fillText('🎉 Tebrikler! '+moves+' hamle',200,190);X.fillStyle='#94A3B8';X.font='14px sans-serif';X.fillText('Tıkla → Tekrar oyna',200,220);}
}
C.addEventListener('click',e=>{
    if(done){init();draw();return;}
    if(lock)return;
    let rect=C.getBoundingClientRect(),mx=(e.clientX-rect.left)*(400/rect.width),my=(e.clientY-rect.top)*(400/rect.height);
    let card=cards.find(c=>{let x=PAD+c.col*(cw+PAD),y=PAD+c.row*(ch+PAD);return mx>=x&&mx<=x+cw&&my>=y&&my<=y+ch;});
    if(!card||flipped.includes(card.idx)||matched.includes(card.idx))return;
    flipped.push(card.idx);draw();
    if(flipped.length===2){moves++;document.getElementById('sc').textContent=moves+' hamle';lock=true;
        let[a,b]=flipped;
        if(cards[a].color===cards[b].color){matched.push(a,b);flipped=[];lock=false;draw();if(matched.length===cards.length){done=true;draw();}}
        else{setTimeout(()=>{flipped=[];lock=false;draw();},700);}
    }
});
init();draw();
</script></body></html>`;
}

// ============================================================
// 🏓 PONG
// ============================================================
function getPongHTML(nonce) {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
<style>${baseCSS()}</style></head><body>
<div id="banner">✨ AI Cevabı Hazır!</div>
${topbarHTML('🏓', 'PONG', 'sc', '#06B6D4')}
<div class="wrap"><canvas id="c" width="500" height="350"></canvas></div>
<div class="hint">FARE veya OK TUŞLARI → Raket kontrol (5 sayıya kadar) | ESC → Kapat</div>
<script nonce="${nonce}">
${baseScript()}
${rrFunc()}
const C=document.getElementById('c'),X=C.getContext('2d'),W=500,H=350,PW=10,PH=70;
let pS=0,aS=0,mouseY=H/2,gOver=false;
const ball={x:W/2,y:H/2,vx:4,vy:3,r:7};
const pad={y:H/2-PH/2};
const ai={y:H/2-PH/2,spd:3};
function resetBall(){ball.x=W/2;ball.y=H/2;ball.vx=(Math.random()>.5?1:-1)*4;ball.vy=(Math.random()-.5)*4;}
function draw(){
    X.fillStyle='#0F172A';X.fillRect(0,0,W,H);
    X.setLineDash([6,6]);X.strokeStyle='#1E293B';X.lineWidth=2;X.beginPath();X.moveTo(W/2,0);X.lineTo(W/2,H);X.stroke();X.setLineDash([]);
    let pg=X.createLinearGradient(14,pad.y,14,pad.y+PH);pg.addColorStop(0,'#06B6D4');pg.addColorStop(1,'#0891B2');X.fillStyle=pg;rr(X,14,pad.y,PW,PH,5);X.fill();
    let ag=X.createLinearGradient(W-24,ai.y,W-24,ai.y+PH);ag.addColorStop(0,'#F472B6');ag.addColorStop(1,'#EC4899');X.fillStyle=ag;rr(X,W-24,ai.y,PW,PH,5);X.fill();
    X.fillStyle='#FBBF24';X.shadowColor='#FBBF24';X.shadowBlur=12;X.beginPath();X.arc(ball.x,ball.y,ball.r,0,Math.PI*2);X.fill();X.shadowBlur=0;
    if(gOver){X.fillStyle='rgba(15,23,42,.75)';X.fillRect(0,0,W,H);X.fillStyle='#F1F5F9';X.font='bold 24px sans-serif';X.textAlign='center';X.fillText(pS>=5?'🏆 Kazandın!':'😢 Kaybettin!',W/2,H/2-12);X.fillStyle='#94A3B8';X.font='14px sans-serif';X.fillText('Skor: '+pS+' – '+aS+'  |  Tıkla → Tekrar',W/2,H/2+18);}
}
function update(){
    if(gOver)return;
    pad.y+=(mouseY-pad.y-PH/2)*.15;pad.y=Math.max(0,Math.min(H-PH,pad.y));
    let t=ball.y-PH/2;if(ai.y<t-5)ai.y+=ai.spd;else if(ai.y>t+5)ai.y-=ai.spd;ai.y=Math.max(0,Math.min(H-PH,ai.y));
    ball.x+=ball.vx;ball.y+=ball.vy;
    if(ball.y-ball.r<=0||ball.y+ball.r>=H)ball.vy*=-1;
    if(ball.x-ball.r<=24&&ball.y>=pad.y&&ball.y<=pad.y+PH&&ball.vx<0){ball.vx=Math.abs(ball.vx)*1.05;ball.vy+=(ball.y-(pad.y+PH/2))*.15;}
    if(ball.x+ball.r>=W-24&&ball.y>=ai.y&&ball.y<=ai.y+PH&&ball.vx>0){ball.vx=-Math.abs(ball.vx)*1.05;ball.vy+=(ball.y-(ai.y+PH/2))*.15;}
    if(ball.x<0){aS++;resetBall();upS();if(aS>=5)gOver=true;}
    if(ball.x>W){pS++;resetBall();upS();if(pS>=5)gOver=true;}
    ball.vx=Math.max(-10,Math.min(10,ball.vx));ball.vy=Math.max(-8,Math.min(8,ball.vy));
}
function upS(){document.getElementById('sc').textContent=pS+' – '+aS;}
function restart(){pS=0;aS=0;gOver=false;resetBall();pad.y=H/2-PH/2;ai.y=H/2-PH/2;upS();}
function loop(){update();draw();requestAnimationFrame(loop);}
C.addEventListener('mousemove',e=>{let r=C.getBoundingClientRect();mouseY=(e.clientY-r.top)*(H/r.height);});
C.addEventListener('click',()=>{if(gOver)restart();});
document.addEventListener('keydown',e=>{if(e.code==='ArrowUp')mouseY-=20;if(e.code==='ArrowDown')mouseY+=20;});
draw();loop();
</script></body></html>`;
}

// ============================================================
// 🧹 TILE CLEANER
// ============================================================
function getTileCleanerHTML(nonce) {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
<style>${baseCSS()}
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
${topbarHTML('🧹', 'TILE CLEANER', 'sc', '#EC4899')}
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
${baseScript()}
document.getElementById('replayBtn').addEventListener('click', () => { resetGame(); });

const W = 500, H = 310;
const bgC = document.getElementById('bgC');
const bgX = bgC.getContext('2d');
const dirtC = document.getElementById('dirtC');
const dX = dirtC.getContext('2d');

// ── Draw the gorgeous hidden background ──────────────────────
function drawHiddenScene() {
    // Deep space base
    const base = bgX.createLinearGradient(0, 0, W, H);
    base.addColorStop(0,   '#0D0221');
    base.addColorStop(0.35,'#0F172A');
    base.addColorStop(0.7, '#130B2B');
    base.addColorStop(1,   '#0D1117');
    bgX.fillStyle = base;
    bgX.fillRect(0, 0, W, H);

    // Glowing nebula blobs
    const blobs = [
        { x:  70, y:  80, r: 130, c1: 'rgba(99,102,241,0.75)',  c2: 'rgba(99,102,241,0)' },
        { x: 420, y:  70, r: 110, c1: 'rgba(236,72,153,0.75)',  c2: 'rgba(236,72,153,0)' },
        { x: 255, y: 175, r: 145, c1: 'rgba(245,158,11,0.55)',  c2: 'rgba(245,158,11,0)' },
        { x:  55, y: 270, r:  95, c1: 'rgba(6,182,212,0.65)',   c2: 'rgba(6,182,212,0)'  },
        { x: 460, y: 255, r: 105, c1: 'rgba(16,185,129,0.65)',  c2: 'rgba(16,185,129,0)' },
        { x: 200, y:  35, r:  85, c1: 'rgba(244,114,182,0.55)', c2: 'rgba(244,114,182,0)' },
        { x: 360, y: 200, r:  75, c1: 'rgba(139,92,246,0.55)',  c2: 'rgba(139,92,246,0)'  },
    ];
    blobs.forEach(b => {
        const g = bgX.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        g.addColorStop(0, b.c1);
        g.addColorStop(1, b.c2);
        bgX.fillStyle = g;
        bgX.fillRect(0, 0, W, H);
    });

    // Stars
    for (let i = 0; i < 140; i++) {
        const sx = Math.random() * W, sy = Math.random() * H;
        const sr = Math.random() * 1.8 + 0.2;
        const al = Math.random() * 0.7 + 0.3;
        bgX.beginPath();
        bgX.arc(sx, sy, sr, 0, Math.PI * 2);
        bgX.fillStyle = \`rgba(255,255,255,\${al})\`;
        bgX.fill();
    }

    // Big glowing stars (cross shape)
    const bigStars = [{x:120,y:150},{x:380,y:100},{x:290,y:260},{x:60,y:50},{x:450,y:180}];
    bigStars.forEach(s => {
        bgX.save();
        bgX.translate(s.x, s.y);
        bgX.strokeStyle = 'rgba(255,255,255,0.9)';
        bgX.lineWidth = 1.5;
        bgX.shadowColor = '#ffffff';
        bgX.shadowBlur = 8;
        bgX.beginPath(); bgX.moveTo(-8,0); bgX.lineTo(8,0); bgX.stroke();
        bgX.beginPath(); bgX.moveTo(0,-8); bgX.lineTo(0,8); bgX.stroke();
        bgX.restore();
    });

    // Constellation lines
    const pts = [{x:120,y:150},{x:200,y:80},{x:310,y:120},{x:380,y:60},{x:440,y:140},{x:380,y:200},{x:290,y:240},{x:180,y:220},{x:120,y:150}];
    bgX.beginPath();
    bgX.strokeStyle = 'rgba(139,92,246,0.3)';
    bgX.lineWidth = 1;
    pts.forEach((p, i) => i === 0 ? bgX.moveTo(p.x, p.y) : bgX.lineTo(p.x, p.y));
    bgX.stroke();
    pts.forEach(p => {
        bgX.beginPath(); bgX.arc(p.x, p.y, 3, 0, Math.PI * 2);
        bgX.fillStyle = 'rgba(139,92,246,0.8)'; bgX.fill();
    });

    // Center glow text hint
    bgX.save();
    bgX.font = 'bold 72px sans-serif';
    bgX.textAlign = 'center';
    bgX.textBaseline = 'middle';
    bgX.globalAlpha = 0.12;
    bgX.fillStyle = '#fff';
    bgX.fillText('✨', W / 2, H / 2);
    bgX.restore();
}

// ── Fill the dirty/foggy overlay ─────────────────────────────
function fillDirt() {
    dX.globalCompositeOperation = 'source-over';
    dX.fillStyle = '#0F172A';
    dX.fillRect(0, 0, W, H);
    // Subtle texture noise
    for (let tx = 0; tx < W; tx += 3) {
        for (let ty = 0; ty < H; ty += 3) {
            if (Math.random() > 0.55) {
                dX.fillStyle = \`rgba(\${15 + Math.random()*20},\${23+Math.random()*15},\${42+Math.random()*15},\${0.3+Math.random()*0.4})\`;
                dX.fillRect(tx, ty, 3, 3);
            }
        }
    }
    // Grungy smudge patches
    for (let i = 0; i < 30; i++) {
        const px = Math.random() * W, py = Math.random() * H;
        const pr = 15 + Math.random() * 40;
        const pg = dX.createRadialGradient(px, py, 0, px, py, pr);
        pg.addColorStop(0, \`rgba(8,12,25,\${0.3+Math.random()*0.3})\`);
        pg.addColorStop(1, 'rgba(8,12,25,0)');
        dX.fillStyle = pg;
        dX.fillRect(px - pr, py - pr, pr * 2, pr * 2);
    }
}

let isDrawing = false;
let done = false;
const BRUSH = 32;
let lastX = null, lastY = null;

function erase(x, y) {
    dX.globalCompositeOperation = 'destination-out';
    // Soft eraser brush
    const g = dX.createRadialGradient(x, y, 0, x, y, BRUSH);
    g.addColorStop(0,   'rgba(0,0,0,1)');
    g.addColorStop(0.55,'rgba(0,0,0,0.85)');
    g.addColorStop(1,   'rgba(0,0,0,0)');
    dX.fillStyle = g;
    dX.beginPath();
    dX.arc(x, y, BRUSH, 0, Math.PI * 2);
    dX.fill();
    dX.globalCompositeOperation = 'source-over';
}

function eraseSegment(x1, y1, x2, y2) {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.max(1, Math.floor(dist / 6));
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        erase(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t);
    }
}

// Progress sampling (every 250ms)
let sampleHandle;
function startSampling() {
    sampleHandle = setInterval(() => {
        if (done) return;
        const imgData = dX.getImageData(0, 0, W, H);
        const d = imgData.data;
        let transp = 0;
        const step = 16; // sample every 4th pixel (4*step bytes)
        for (let i = 3; i < d.length; i += 4 * step) {
            if (d[i] < 100) transp++;
        }
        const total = (d.length / 4) / step;
        const pct = Math.min(100, Math.round((transp / total) * 100));
        document.getElementById('pbar').style.width = pct + '%';
        document.getElementById('sc').textContent = pct + '%';

        if (pct < 20)       document.getElementById('pctLabel').textContent = '🖌️ Fareyle yüzeyi temizleyin…';
        else if (pct < 45)  document.getElementById('pctLabel').textContent = '🔥 ' + pct + '% temizlendi — devam!';
        else if (pct < 70)  document.getElementById('pctLabel').textContent = '✨ ' + pct + '% temizlendi — harika!';
        else if (pct < 90)  document.getElementById('pctLabel').textContent = '🌟 ' + pct + '% — neredeyse bitti!';
        else if (pct < 100) document.getElementById('pctLabel').textContent = '💫 ' + pct + '% — son dokunuşlar!';

        if (pct >= 92 && !done) {
            done = true;
            clearInterval(sampleHandle);
            dX.clearRect(0, 0, W, H); // reveal everything
            document.getElementById('pbar').style.width = '100%';
            document.getElementById('sc').textContent = '100%';
            document.getElementById('pctLabel').textContent = '🎉 Mükemmel! Gizem ortaya çıktı!';
            setTimeout(() => document.getElementById('doneOverlay').classList.add('show'), 400);
        }
    }, 250);
}

function resetGame() {
    done = false;
    clearInterval(sampleHandle);
    document.getElementById('doneOverlay').classList.remove('show');
    document.getElementById('pbar').style.width = '0%';
    document.getElementById('sc').textContent = '0%';
    document.getElementById('pctLabel').textContent = '🖌️ Fareyle yüzeyi temizleyin…';
    fillDirt();
    startSampling();
}

dirtC.addEventListener('mousedown', e => { isDrawing = true; lastX = null; lastY = null; });
dirtC.addEventListener('mouseup',   () => { isDrawing = false; lastX = null; lastY = null; });
dirtC.addEventListener('mouseleave',() => { isDrawing = false; lastX = null; lastY = null; });
dirtC.addEventListener('mousemove', e => {
    if (!isDrawing || done) return;
    const rect = dirtC.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top)  * (H / rect.height);
    if (lastX !== null) eraseSegment(lastX, lastY, x, y);
    else erase(x, y);
    lastX = x; lastY = y;
});

// Init
drawHiddenScene();
fillDirt();
startSampling();
<\/script></body></html>`;
}

function deactivate() {
    if (gamePanel) { gamePanel.dispose(); gamePanel = null; }
    if (closeTimeout) { clearTimeout(closeTimeout); closeTimeout = null; }
}

module.exports = { activate, deactivate };
