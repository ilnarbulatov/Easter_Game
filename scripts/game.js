const basket = { x: 0, y: 0, w: 110, h: 122 };
const eggs = [];
let slowUntil = 0;

function getRandomEggType() {
    const r = Math.random();
    if (r < 0.7) return 'normal';
    if (r < 0.85) return 'golden';
    if (r < 0.95) return 'ice';
    return 'rotten';
}

function spawnEgg() {
    if (!gameActive || cheatDetected) return;
    if (isMobile && eggs.length > 12) return;

    eggs.push({
        x: Math.random() * (canvas.width - 50) + 25,
        y: -50,
        baseSpeed: 3 + (window.score / 15),
        type: getRandomEggType()
    });
    spawnTimeout = setTimeout(spawnEgg, Math.max(400, 1100 - window.score * 15));
}

function applyCatchEffect(egg, index) {
    if (cheatDetected) return;

    totalCatches++;
    if (egg.type === 'golden') goldenCatches++;

    const now = Date.now();
    if (now - lastCatchTime < 15 && totalCatches > 10) {
        banCheater('Слишком частая поимка!');
        return;
    }
    lastCatchTime = now;

    let points = 1;
    let msg = '+1';
    let color = '#4CAF50';

    if (egg.type === 'golden') {
        points = 5;
        msg = '+5 ';
        color = '#FFD700';
    } else if (egg.type === 'ice') {
        points = 0;
        slowUntil = now + 2000;
        msg = ' ЗАМЕДЛЕНИЕ ';
        color = '#80D8FF';
    } else if (egg.type === 'rotten') {
        points = -1;
        msg = '-1 ';
        color = '#8B4513';
    }

    window.score += points;
    const { x, y } = egg;
    setTimeout(() => showFloatingMessage(msg, x, y, color), 0);
    eggs.splice(index, 1);
}

function gameOver() {
    if (!gameActive || cheatDetected) return;
    gameActive = false;
    clearTimeout(spawnTimeout);
    cancelAnimationFrame(animationId);
    canvas.style.cursor = 'auto';

    showNameModal(async (playerName) => {
        if (playerName && !cheatDetected) {
            await saveScoreToBackend(playerName, window.score);
        }
        showLeaderboardOnly('ИГРА ОКОНЧЕНА!', true);
    });
}

function draw() {
    if (!gameActive || cheatDetected) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#8bc34a';
    ctx.fillRect(0, canvas.height - 30, canvas.width, 30);

    if (basketLoaded) {
        ctx.drawImage(basketImg, basket.x, basket.y, basket.w, basket.h);
    } else {
        ctx.fillStyle = '#795548';
        ctx.beginPath();
        ctx.roundRect(basket.x, basket.y, basket.w, basket.h, 10);
        ctx.fill();
    }

    const isSlow = Date.now() < slowUntil;
    const eggSize = 48;

    for (let i = 0; i < eggs.length; i++) {
        const egg = eggs[i];
        egg.y += isSlow ? egg.baseSpeed * 0.5 : egg.baseSpeed;

        const img = eggImages[egg.type];
        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, egg.x - eggSize / 2, egg.y - eggSize / 2, eggSize, eggSize);
        } else {
            const colors = { golden: '#FFD700', ice: '#80D8FF', rotten: '#8B4513' };
            ctx.fillStyle = colors[egg.type] || '#ffaa00';
            ctx.beginPath();
            ctx.ellipse(egg.x, egg.y, eggSize / 2, eggSize / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.stroke();
        }

        if (egg.y + eggSize / 2 > basket.y && egg.x > basket.x && egg.x < basket.x + basket.w) {
            applyCatchEffect(egg, i);
            i--;
            continue;
        }

        if (egg.y + eggSize / 2 > canvas.height) {
            if (egg.type === 'rotten') {
                eggs.splice(i, 1);
                i--;
                continue;
            }
            gameOver();
            return;
        }
    }

    animationId = requestAnimationFrame(draw);
}

if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.moveTo(x + r, y);
        this.lineTo(x + w - r, y);
        this.quadraticCurveTo(x + w, y, x + w, y + r);
        this.lineTo(x + w, y + h - r);
        this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.lineTo(x + r, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r);
        this.lineTo(x, y + r);
        this.quadraticCurveTo(x, y, x + r, y);
        return this;
    };
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    basket.w = Math.min(110, canvas.width / 3);
    basket.h = basket.w * (823 / 740);
    basket.y = canvas.height - basket.h - 15;
    basket.x = Math.min(Math.max(0, basket.x), canvas.width - basket.w);
}

function handleMove(clientX) {
    if (!gameActive) return;
    basket.x = Math.min(Math.max(0, clientX - basket.w / 2), canvas.width - basket.w);
}

window.addEventListener('resize', () => { if (gameActive) { resize(); draw(); } });
window.addEventListener('mousemove', (e) => { if (gameActive) handleMove(e.clientX); });
window.addEventListener('touchmove', (e) => { if (gameActive) { e.preventDefault(); handleMove(e.touches[0].clientX); } });
window.addEventListener('touchstart', (e) => { if (gameActive) { e.preventDefault(); handleMove(e.touches[0].clientX); } });
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

if (isEventActive()) {
    resize();
    collectBehaviorData();
    spawnEgg();
    animationId = requestAnimationFrame(draw);
    gameStartTime = Date.now();
} else {
    document.body.classList.add('event-ended');
    canvas.style.pointerEvents = 'none';
    gameActive = false;
    showLeaderboardOnly(' Пасхальный сбор завершён ', false);
}
