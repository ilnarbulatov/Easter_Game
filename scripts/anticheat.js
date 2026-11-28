let cheatDetected = false;
let gameStartTime = Date.now();
let clickTimes = [];
let mouseMovements = [];
let totalCatches = 0;
let goldenCatches = 0;
let lastCatchTime = 0;

Object.defineProperty(window, 'score', {
    get() { return realScore; },
    set(val) {
        if (val > realScore + 10 && !cheatDetected) {
            banCheater('Попытка взлома счёта!');
            return;
        }
        realScore = val;
        document.getElementById('score').innerText = realScore;
    }
});

function collectBehaviorData() {
    document.addEventListener('click', () => {
        clickTimes.push(Date.now());
        if (clickTimes.length > 30) clickTimes.shift();
    });

    document.addEventListener('mousemove', (e) => {
        if (!gameActive) return;
        mouseMovements.push({ x: e.clientX, y: e.clientY, time: Date.now() });
        if (mouseMovements.length > 200) mouseMovements.shift();
    });
}

function isHumanBehavior() {
    if (clickTimes.length > 10) {
        const intervals = [];
        for (let i = 1; i < clickTimes.length; i++) {
            intervals.push(clickTimes[i] - clickTimes[i - 1]);
        }
        const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        if (avg < 30 && intervals.length > 5) return false;
    }

    let straightLines = 0;
    for (let i = 2; i < mouseMovements.length; i++) {
        const dx1 = mouseMovements[i - 1].x - mouseMovements[i - 2].x;
        const dy1 = mouseMovements[i - 1].y - mouseMovements[i - 2].y;
        const dx2 = mouseMovements[i].x - mouseMovements[i - 1].x;
        const dy2 = mouseMovements[i].y - mouseMovements[i - 1].y;

        if (Math.abs(dx1) > 50 && Math.abs(dy1) < 15 &&
            Math.abs(dx2) > 50 && Math.abs(dy2) < 15) {
            straightLines++;
        }
    }
    return straightLines <= 50;
}

function isHeadlessBrowser() {
    return Boolean(navigator.webdriver || navigator.userAgent.includes('Headless'));
}

function banCheater(reason) {
    if (cheatDetected || !gameActive) return;
    cheatDetected = true;
    gameActive = false;

    clearTimeout(spawnTimeout);
    cancelAnimationFrame(animationId);

    const alertDiv = document.createElement('div');
    alertDiv.className = 'cheat-alert';
    alertDiv.innerHTML = `🚫 ЧИТ ОБНАРУЖЕН! 🚫<br><small>${reason}<br>Ваш результат не будет сохранён.</small>`;
    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
        location.reload();
    }, 3000);
}
