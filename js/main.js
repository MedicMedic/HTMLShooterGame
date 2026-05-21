// ======= MAIN ENTRY POINT =======

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ===== Game States =====
const STATE = {
  MENU:      'menu',
  TUTORIAL:  'tutorial',
  PLAYING:   'playing',
  PAUSED:    'paused',
  GAME_OVER: 'game_over',
};

// ===== Audio =====
// Replace any null with: new Audio('path/to/file') to enable that sound/track.
const AUDIO = {
  sfx: {
    shoot:        null, // new Audio('assets/audio/shoot.wav')
    hit:          null, // new Audio('assets/audio/hit.wav')
    enemyDeath:   null, // new Audio('assets/audio/enemy_death.wav')
    playerHurt:   null, // new Audio('assets/audio/player_hurt.wav')
    bulletPickup: null, // new Audio('assets/audio/pickup.wav')
    healthPickup: null, // new Audio('assets/audio/heal.wav')
    jump:         null, // new Audio('assets/audio/jump.wav')
    waveStart:    null, // new Audio('assets/audio/wave_start.wav')
    gameOver:     null, // new Audio('assets/audio/game_over.wav')
    pause:        null, // new Audio('assets/audio/pause.wav')
  },
  music: {
    menu:         null, // new Audio('assets/audio/music_menu.mp3')
    gameplay:     null, // new Audio('assets/audio/music_gameplay.mp3')
  }
};

function playSound(key) {
  const snd = AUDIO.sfx[key];
  if (!snd) return;
  snd.currentTime = 0;
  snd.play().catch(() => {});
}

function playMusic(key) {
  for (const t of Object.values(AUDIO.music)) if (t) { t.pause(); t.currentTime = 0; }
  const track = AUDIO.music[key];
  if (!track) return;
  track.loop = true;
  track.play().catch(() => {});
}

// ===== Image Storage =====
const IMAGES = {
  player: new Image(),
  platform: new Image(),
  healthPickup: null,
  bullets: {},
  enemies: {},
};

function preloadImages(onAllLoaded) {
  const toLoad = [];

  IMAGES.player.src = CONFIG.sprites.player;
  toLoad.push(IMAGES.player);

  IMAGES.platform.src = CONFIG.sprites.platform;
  toLoad.push(IMAGES.platform);

  if (CONFIG.assets?.healthPickup) {
    IMAGES.healthPickup = new Image();
    IMAGES.healthPickup.src = CONFIG.assets.healthPickup;
    toLoad.push(IMAGES.healthPickup);
  }

  for (const [type, info] of Object.entries(CONFIG.bullets)) {
    const img = new Image();
    img.src = info.src;
    IMAGES.bullets[type] = img;
    toLoad.push(img);
  }

  for (const [type, info] of Object.entries(CONFIG.enemies)) {
    const frames = [];
    for (const src of info.frames) {
      const img = new Image();
      img.src = src;
      frames.push(img);
      toLoad.push(img);
    }
    IMAGES.enemies[type] = frames;
    if (info.jumpFrame) {
      const img = new Image();
      img.src = info.jumpFrame;
      IMAGES.enemies[type].jumpFrame = img;
      toLoad.push(img);
    }
  }

  let loaded = 0;
  toLoad.forEach(img => {
    img.onload = img.onerror = () => {
      if (++loaded === toLoad.length) onAllLoaded();
    };
  });
}

// ===== Mobile controls =====
function _wireMobileControls(game) {
  // Map button id -> key to dispatch
  const held = {
    'mc-btn-left':  'arrowleft',
    'mc-btn-right': 'arrowright',
    'mc-btn-up':    'arrowup',
    'mc-btn-down':  'arrowdown',
    'mc-btn-fire':  'enter',
    'mc-btn-swap':  'c',
  };

  const kd = key => document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  const ku = key => document.dispatchEvent(new KeyboardEvent('keyup',   { key, bubbles: true }));

  for (const [id, key] of Object.entries(held)) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.addEventListener('touchstart', e => { e.preventDefault(); kd(key); }, { passive: false });
    el.addEventListener('touchend',   e => { e.preventDefault(); ku(key); }, { passive: false });
    el.addEventListener('mousedown',  () => kd(key));
    el.addEventListener('mouseup',    () => ku(key));
  }

  // Pause button
  const pauseBtn = document.getElementById('btn-pause');
  if (pauseBtn) {
    pauseBtn.addEventListener('touchstart', e => { e.preventDefault(); game._togglePause(); }, { passive: false });
    pauseBtn.addEventListener('click', () => game._togglePause());
  }

  // Fullscreen button (landscape only)
  const fsBtn = document.getElementById('btn-fullscreen');
  if (fsBtn) {
    const toggleFS = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
        fsBtn.textContent = '[ X ]';
      } else {
        document.exitFullscreen().catch(() => {});
        fsBtn.textContent = '[ ]';
      }
    };
    fsBtn.addEventListener('click', toggleFS);
    fsBtn.addEventListener('touchstart', e => { e.preventDefault(); toggleFS(); }, { passive: false });
    document.addEventListener('fullscreenchange', () => {
      fsBtn.textContent = document.fullscreenElement ? '[ X ]' : '[ ]';
    });
  }

  // CSS media queries handle showing/hiding controls automatically.
}

// ===== Boot =====
function startGame() {
  const game = new Game(ctx, IMAGES);

  document.addEventListener('visibilitychange', () => {
    game.paused = document.hidden;
    if (!game.paused) game.lastFrameTime = performance.now();
  });

  _wireMobileControls(game);
  game.start();
}

preloadImages(startGame);
