async function saveScoreToBackend(playerName, finalScore) {
    const gameDuration = Date.now() - gameStartTime;

    if (gameDuration < finalScore * 40 && finalScore > 50) {
        showToast('❌ Слишком быстро');
        return false;
    }
    if (!isHumanBehavior()) {
        showToast('❌ Подозрительное поведение');
        return false;
    }
    if (isHeadlessBrowser()) {
        showToast('❌ Браузер не поддерживается');
        return false;
    }
    if (totalCatches > 0 && (goldenCatches / totalCatches) * 100 > 70) {
        showToast('❌ Подозрительный результат');
        return false;
    }

    try {
        const res = await fetch(`${BACKEND_URL}/api/save-score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                playerName,
                score: finalScore,
                gameData: {
                    score: finalScore,
                    gameDuration,
                    totalCatches,
                    goldenCatches,
                    clickCount: clickTimes.length
                }
            })
        });
        const result = await res.json();

        if (result.success) {
            showToast('✅ Результат сохранён!');
            return true;
        }
        showToast('❌ ' + (result.message || 'Ошибка сохранения'));
        return false;
    } catch (e) {
        console.error(e);
        showToast('⚠️ Ошибка соединения с сервером');
        return false;
    }
}

async function getTopScoresFromBackend() {
    const topList = document.getElementById('top-list');
    try {
        const res = await fetch(`${BACKEND_URL}/api/top-scores`);
        const data = await res.json();

        if (data.success && data.top && data.top.length > 0) {
            let html = "<h3 style='margin:5px 0'>🏆 Топ игроков 🏆</h3>";
            data.top.forEach((entry, idx) => {
                html += `<div class="entry"><span>${idx + 1}. ${escapeHtml(entry.name)}</span><b>${entry.score}</b></div>`;
            });
            topList.innerHTML = html;
        } else {
            topList.innerHTML = '<div>Пока нет рекордов. Будь первым!</div>';
        }

        const fallbackScore = localStorage.getItem('fallbackScore');
        const fallbackName = localStorage.getItem('fallbackName');
        if (fallbackScore && fallbackName) {
            topList.innerHTML += `<div class="entry" style="background:#ffe0a3;"><span>📱 Локальный рекорд: ${escapeHtml(fallbackName)}</span><b>${fallbackScore}</b></div>`;
        }
    } catch (e) {
        console.error(e);
        topList.innerHTML = '⚠️ Не удалось загрузить рейтинг';
    }
}
