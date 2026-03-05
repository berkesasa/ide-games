const vscode = require('vscode');
const { get2048HTML } = require('./games/game2048');
const { getRunnerHTML } = require('./games/runner');
const { getMemoryHTML } = require('./games/memory');
const { getCodeDustHTML } = require('./games/codedust');

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
        tilecleaner: getCodeDustHTML,
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

function deactivate() {
    if (gamePanel) { gamePanel.dispose(); gamePanel = null; }
    if (closeTimeout) { clearTimeout(closeTimeout); closeTimeout = null; }
}

module.exports = { activate, deactivate };
