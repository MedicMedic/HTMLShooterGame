// ======= MAIN ENTRY POINT =======

// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Image storage
const IMAGES = {
  player: new Image(),
  platform: new Image(),
  bullets: {},
  enemies: {}
};

/**
 * Preload all game images
 */
function preloadImages(onAllLoaded) {
  const toLoad = [];

  // Player sprite
  IMAGES.player.src = CONFIG.sprites.player;
  toLoad.push(IMAGES.player);

  // Platform sprite
  IMAGES.platform.src = CONFIG.sprites.platform;
  toLoad.push(IMAGES.platform);

  // Bullet sprites
  for (const [type, info] of Object.entries(CONFIG.bullets)) {
    const img = new Image();
    img.src = info.src;
    IMAGES.bullets[type] = img;
    toLoad.push(img);
  }

  // Enemy sprites (each enemy has multiple frames)
  for (const [type, info] of Object.entries(CONFIG.enemies)) {
    const frames = [];

    // Load each animation frame
    for (const src of info.frames) {
      const img = new Image();
      img.src = src;
      frames.push(img);
      toLoad.push(img);
    }

    IMAGES.enemies[type] = frames;

    // Load jump frame if it exists
    if (info.jumpFrame) {
      const img = new Image();
      img.src = info.jumpFrame;
      IMAGES.enemies[type].jumpFrame = img;
      toLoad.push(img);
    }
  }

  // Wait for all images to load
  let loaded = 0;
  toLoad.forEach(img => {
    img.onload = img.onerror = () => {
      loaded++;
      if (loaded === toLoad.length) {
        onAllLoaded();
      }
    };
  });
}

/**
 * Initialize and start the game
 */
function startGame() {
  const game = new Game(ctx, IMAGES);
  game.start();
}

// Preload all assets and start the game
preloadImages(startGame);
