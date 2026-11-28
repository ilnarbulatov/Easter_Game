function escapeHtml(str) {
    return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : (m === '<' ? '&lt;' : '&gt;'));
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.innerText = message;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 2500);
}

function showFloatingMessage(text, x, y, color = '#ffaa00') {
    const div = document.createElement('div');
    div.className = 'floating-message';
    div.innerText = text;
    div.style.left = x + 'px';
    div.style.top = y + 'px';
    div.style.color = color;

    if (isMobile) {
        div.style.fontSize = '20px';
        div.style.fontWeight = 'bold';
    }

    document.body.appendChild(div);
    setTimeout(() => div.remove(), 600);
}

function showNameModal(callback) {
    const modal = document.createElement('div');
    modal.className = 'name-modal';
    modal.innerHTML = `
        <div class="name-modal-content">
            <div class="close-modal">&times;</div>
            <h2> </h2>
            <p>Ваш счёт: ${window.score}</p>
            <input type="text" id="player-name-input" placeholder="Введите имя" maxlength="20" autocomplete="off">
            <div class="name-modal-buttons">
                <button class="name-modal-btn" id="save-name-btn">Сохранить</button>
                <button class="name-modal-btn cancel" id="cancel-name-btn">Пропустить</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const input = modal.querySelector('#player-name-input');
    const finish = (name) => {
        modal.remove();
        callback(name || null);
    };

    modal.querySelector('#save-name-btn').onclick = () => finish(input.value.trim() || 'Аноним');
    modal.querySelector('#cancel-name-btn').onclick = () => finish(null);
    modal.querySelector('.close-modal').onclick = () => finish(null);
    input.onkeypress = (e) => {
        if (e.key === 'Enter') finish(input.value.trim() || 'Аноним');
    };

    setTimeout(() => input.focus(), 50);
}

function showLeaderboardOnly(title, showReload = true) {
    document.getElementById('leaderboard-title').innerText = title;
    const reloadBtn = document.getElementById('reload-btn');
    reloadBtn.classList.toggle('hidden', !showReload);
    document.getElementById('leaderboard-screen').style.display = 'block';
    getTopScoresFromBackend();
}
