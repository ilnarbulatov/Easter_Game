const BACKEND_URL = 'https://workers.dev';
const EVENT_END = new Date(2027, 3, 12, 19, 0, 0);
const IMG_PATH = 'assets/images/';
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

function isEventActive() {
    return new Date() < EVENT_END;
}

const basketImg = new Image();
basketImg.src = IMG_PATH + 'korzina.png';
let basketLoaded = false;
basketImg.onload = () => { basketLoaded = true; };

const eggImages = {
    normal: new Image(),
    golden: new Image(),
    ice: new Image(),
    rotten: new Image()
};
eggImages.normal.src = IMG_PATH + 'norm.png';
eggImages.golden.src = IMG_PATH + 'zolo.png';
eggImages.ice.src = IMG_PATH + 'zamoroz.png';
eggImages.rotten.src = IMG_PATH + 'kaka.png';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let realScore = 0;
let gameActive = true;
let spawnTimeout = null;
let animationId = null;
