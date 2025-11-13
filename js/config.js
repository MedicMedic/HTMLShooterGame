// ======= GAME CONFIGURATION =======
const CONFIG = {
  player: {
    width: 50,
    height: 50,
    speed: 300,  // pixels per second (was 5 per frame)
    jumpStrength: -900,  // pixels per second (increased for platform jumping)
    gravity: 1800,  // pixels per second squared (was 0.3 per frame)
    groundY: 550,
    flicker: { holdMs: 5000, durationMs: 2000, slowFactor: 0.5 },
    maxHP: 100,
    lives: 3,
    respawnInvulnMs: 1500,
  },
  combat: {
    touchDamage: 10,
    touchDamageCooldown: 500
  },
  bullets: {
    1: { width: 20, height: 20, speed: 360, src: 'assets/bullets/bullet1.png' },  // was 6
    2: { width: 20, height: 20, speed: 360, src: 'assets/bullets/bullet2.png' },
    3: { width: 20, height: 20, speed: 420, src: 'assets/bullets/bullet3.png' },  // was 7
    4: { width: 20, height: 20, speed: 420, src: 'assets/bullets/bullet4.png' },
    5: { width: 20, height: 20, speed: 480, src: 'assets/bullets/bullet5.png' },  // was 8
    6: { width: 20, height: 20, speed: 540, src: 'assets/bullets/bullet6.png' },  // was 9
    7: { width: 20, height: 20, speed: 600, src: 'assets/bullets/bullet7.png' },  // was 10
    8: { width: 20, height: 20, speed: 720, src: 'assets/bullets/bullet8.png' },  // was 12
  },
  bulletTypes: [1, 2, 3, 4, 5, 6, 7, 8],
  enemies: {
    1: { // Hate
      width: 50, height: 50, baseSpeed: 72, baseHealth: 10,  // was 1.2
      frames: [
        'assets/enemies/enemy1_1.png',
        'assets/enemies/enemy1_2.png'
      ],
      jumpFrame: 'assets/enemies/enemy1_jump.png',
      animMode: "step",
      jumpStrength: -720,  // increased for platform jumping
      animationInterval: 300,
    },
    2: { // Void
      width: 50, height: 50, baseSpeed: 60, baseHealth: 15,  // was 1.0
      frames: [
        'assets/enemies/enemy2_1.png',
        'assets/enemies/enemy2_2.png',
      ],
      animMode: "fade",
      animationInterval: 500,
      jumpStrength: -720  // increased for platform jumping
    },
    3: { // Thoughtless
      width: 50, height: 50, baseSpeed: 60, baseHealth: 15,
      frames: [
        'assets/enemies/enemy3_1.png',
        'assets/enemies/enemy3_2.png',
      ],
      animMode: "step",
      jumpStrength: -720,  // increased for platform jumping
      animationInterval: 300,
    },
    4: { // Blind
      width: 50, height: 50, baseSpeed: 90, baseHealth: 20,  // was 1.5
      frames: [
        'assets/enemies/enemy4_1.png',
        'assets/enemies/enemy4_2.png'
      ],
      jumpFrame: 'assets/enemies/enemy4_jump.png',
      animMode: "step",
      jumpStrength: -720,  // increased for platform jumping
      animationInterval: 300,
    },
    5: { // Ignorance
      width: 50, height: 50, baseSpeed: 90, baseHealth: 20,
      frames: [
        'assets/enemies/enemy5_1.png',
        'assets/enemies/enemy5_2.png',
      ],
      animMode: "step",
      jumpStrength: -900,  // increased for platform jumping
      animationInterval: 300,
    },
    6: { // Lethargy
      width: 50, height: 50, baseSpeed: 6, baseHealth: 20,  // was 0.1
      frames: [
        'assets/enemies/enemy6_1.png',
        'assets/enemies/enemy6_2.png'
      ],
      animMode: "step",
      jumpStrength: 0,
      animationInterval: 300,
    },
    7: { // Papa Fish
      width: 50, height: 50, baseSpeed: 300, baseHealth: 20,  // was 5
      frames: [
        'assets/enemies/enemy7_1.png',
        'assets/enemies/enemy7_2.png'
      ],
      jumpFrame: 'assets/enemies/enemy7_jump.png',
      animMode: "step",
      jumpStrength: -1200,  // increased for platform jumping
      animationInterval: 200,
    },
    8: { // Impostor Syndrome
      width: 100, height: 100, baseSpeed: 30, baseHealth: 100,  // was 0.5
      frames: [
        'assets/enemies/enemy8_1.png',
        'assets/enemies/enemy8_2.png'
      ],
      animMode: "step",
      jumpStrength: 0,
      animationInterval: 400,
    },
  },
  sprites: {
    player: 'assets/player/player_idle.png',
    playerWalk: [
      'assets/player/player_walking_1.png',
      'assets/player/player_idle.png',
      'assets/player/player_walking_2.png',
      'assets/player/player_idle.png',
    ],
    playerJump: 'assets/player/player_jump.png',
    playerThrow: 'assets/player/player_throw.png',
    platform: 'assets/environment/platform.png'
  },
  waves: {
    startEnemies: 3,
    coolDownMs: 2000,
    speedIncreasePerWave: 12,  // was 0.2 per frame
  },
  platforms: [
    { x: 75, y: 454, width: 300, height: 30 },
    { x: 460, y: 421, width: 300, height: 30 },
    { x: 465, y: 306, width: 300, height: 30 },
    { x: 53, y: 277, width: 300, height: 30 },
    { x: 320, y: 162, width: 300, height: 30 },
  ],
  particles: {
    shootCount: 3,  // reduced from 8 for more subtle effect
    hitCount: 8,  // reduced from 15 for more subtle effect
    gravity: 300,
    lifetime: 500,  // reduced from 800 for quicker fade
    trailCount: 2,  // particles per trail emission
    trailInterval: 50,  // milliseconds between trail emissions
  }
};

// ======= DAMAGE MATRIX =======
// Y axis - Bullet Type, X axis - Enemy Type
// Each bullet is super effective (15 damage) against its matching enemy number
// Bullet does moderate damage (5-8) to most enemies
// Bullet does low damage (2-3) to enemies it's weak against
// Bullet 8 is special: hits all enemies well except enemy 8
const DAMAGE_MATRIX = {
  // Bullet 1 - Super effective vs Hate (1), moderate vs others
  1: { 1: 15, 2: 5, 3: 6, 4: 5, 5: 4, 6: 6, 7: 5, 8: 7 },

  // Bullet 2 - Super effective vs Void (2), weak vs tangible enemies
  2: { 1: 4, 2: 15, 3: 3, 4: 3, 5: 6, 6: 5, 7: 4, 8: 7 },

  // Bullet 3 - Super effective vs Thoughtless (3), good vs mental enemies
  3: { 1: 6, 2: 5, 3: 15, 4: 6, 5: 8, 6: 4, 7: 5, 8: 7 },

  // Bullet 4 - Super effective vs Blind (4), good vs perception enemies
  4: { 1: 5, 2: 6, 3: 5, 4: 15, 5: 6, 6: 5, 7: 6, 8: 7 },

  // Bullet 5 - Super effective vs Ignorance (5), good vs mental blocks
  5: { 1: 5, 2: 5, 3: 7, 4: 6, 5: 15, 6: 6, 7: 5, 8: 7 },

  // Bullet 6 - Super effective vs Lethargy (6), moderate vs active enemies
  6: { 1: 6, 2: 5, 3: 5, 4: 5, 5: 5, 6: 15, 7: 4, 8: 7 },

  // Bullet 7 - Super effective vs Papa Fish (7), good vs fast enemies
  7: { 1: 5, 2: 4, 3: 5, 4: 6, 5: 5, 6: 5, 7: 15, 8: 7 },

  // Bullet 8 - Special: hits all enemies well EXCEPT enemy 8 (Impostor Syndrome)
  8: { 1: 10, 2: 10, 3: 10, 4: 10, 5: 10, 6: 10, 7: 10, 8: 1 },
};
