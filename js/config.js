// ======= GAME CONFIGURATION =======
const CONFIG = {
  player: {
    width: 50,
    height: 50,
    speed: 300,  // pixels per second (was 5 per frame)
    jumpStrength: -600,  // pixels per second (was -10 per frame)
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
      jumpStrength: -480,  // was -8
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
      jumpStrength: -480
    },
    3: { // Thoughtless
      width: 50, height: 50, baseSpeed: 60, baseHealth: 15,
      frames: [
        'assets/enemies/enemy3_1.png',
        'assets/enemies/enemy3_2.png',
      ],
      animMode: "step",
      jumpStrength: -480,
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
      jumpStrength: -480,
      animationInterval: 300,
    },
    5: { // Ignorance
      width: 50, height: 50, baseSpeed: 90, baseHealth: 20,
      frames: [
        'assets/enemies/enemy5_1.png',
        'assets/enemies/enemy5_2.png',
      ],
      animMode: "step",
      jumpStrength: -720,  // was -12
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
      jumpStrength: -900,  // was -15
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
    shootCount: 8,
    hitCount: 15,
    gravity: 300,
    lifetime: 800,  // milliseconds
  }
};

// ======= DAMAGE MATRIX =======
// Y axis - Bullet Type, X axis - Enemy Type
const DAMAGE_MATRIX = {
  1: { 1: 5, 2: 1, 3: 10, 4: 10, 5: 10, 6: 10, 7: 10, 8: 10 },
  2: { 1: 1, 2: 10, 3: 10, 4: 10, 5: 10, 6: 10, 7: 10, 8: 10 },
  3: { 1: 10, 2: 10, 3: 10, 4: 10, 5: 10, 6: 10, 7: 10, 8: 10 },
  4: { 1: 10, 2: 10, 3: 10, 4: 10, 5: 10, 6: 10, 7: 10, 8: 10 },
  5: { 1: 10, 2: 10, 3: 10, 4: 10, 5: 10, 6: 10, 7: 10, 8: 10 },
  6: { 1: 10, 2: 10, 3: 10, 4: 10, 5: 10, 6: 10, 7: 10, 8: 10 },
  7: { 1: 10, 2: 10, 3: 10, 4: 10, 5: 10, 6: 10, 7: 10, 8: 10 },
  8: { 1: 10, 2: 10, 3: 10, 4: 10, 5: 10, 6: 10, 7: 10, 8: 10 },
};
