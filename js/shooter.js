// ===== Canvas & Context =====
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ===== Game States =====
const STATE = { MENU: 'menu', TUTORIAL: 'tutorial', PLAYING: 'playing', GAME_OVER: 'game_over' };

// ======= CONFIG =======
const CONFIG = {
  player: {
    width: 50, height: 50, speed: 5,
    jumpStrength: -10, gravity: 0.3, groundY: 550,
    flicker: { holdMs: 5000, durationMs: 2000, slowFactor: 0.5 },
    maxHP: 100, lives: 3, respawnInvulnMs: 1500,
  },
  combat: { touchDamage: 10, touchDamageCooldown: 500 },
  bullets: {
    1: { width: 20, height: 20, speed: 6,  src: 'assets/bullets/bullet1.png' },
    2: { width: 20, height: 20, speed: 6,  src: 'assets/bullets/bullet2.png' },
    3: { width: 20, height: 20, speed: 7,  src: 'assets/bullets/bullet3.png' },
    4: { width: 20, height: 20, speed: 7,  src: 'assets/bullets/bullet4.png' },
    5: { width: 20, height: 20, speed: 8,  src: 'assets/bullets/bullet5.png' },
    6: { width: 20, height: 20, speed: 9,  src: 'assets/bullets/bullet6.png' },
    7: { width: 20, height: 20, speed: 10, src: 'assets/bullets/bullet7.png' },
    8: { width: 20, height: 20, speed: 12, src: 'assets/bullets/bullet8.png' },
  },
  enemies: {
    1: {
      name: 'Hate',
      width: 50, height: 50, baseSpeed: 1.2, baseHealth: 10,
      frames: ['assets/enemies/enemy1_1.png', 'assets/enemies/enemy1_2.png'],
      jumpFrame: 'assets/enemies/enemy1_jump.png',
      animMode: 'step', jumpStrength: -8, dropsBullet: 1,
    },
    2: {
      name: 'Void',
      width: 50, height: 50, baseSpeed: 1.0, baseHealth: 15,
      frames: ['assets/enemies/enemy2_1.png', 'assets/enemies/enemy2_2.png'],
      animMode: 'fade', animationInterval: 500,
      jumpStrength: -8, dropsBullet: 2,
    },
    3: {
      name: 'Thoughtless',
      width: 50, height: 50, baseSpeed: 1.0, baseHealth: 15,
      frames: ['assets/enemies/enemy3_1.png', 'assets/enemies/enemy3_2.png'],
      animMode: 'step', jumpStrength: -8, dropsBullet: 3,
    },
    4: {
      name: 'Blind',
      width: 50, height: 50, baseSpeed: 1.5, baseHealth: 20,
      frames: ['assets/enemies/enemy4_1.png', 'assets/enemies/enemy4_2.png'],
      jumpFrame: 'assets/enemies/enemy4_jump.png',
      animMode: 'step', jumpStrength: -8, dropsBullet: 4,
    },
    5: {
      name: 'Ignorance',
      width: 50, height: 50, baseSpeed: 1.5, baseHealth: 20,
      frames: ['assets/enemies/enemy5_1.png', 'assets/enemies/enemy5_2.png'],
      animMode: 'step', jumpStrength: -12, dropsBullet: 5,
    },
    6: {
      name: 'Lethargy',
      width: 50, height: 50, baseSpeed: 0.1, baseHealth: 20,
      frames: ['assets/enemies/enemy6_1.png', 'assets/enemies/enemy6_2.png'],
      animMode: 'step', jumpStrength: 0, dropsBullet: 6,
    },
    7: {
      name: 'Papa Fish',
      width: 50, height: 50, baseSpeed: 5, baseHealth: 20,
      frames: ['assets/enemies/enemy7_1.png', 'assets/enemies/enemy7_2.png'],
      jumpFrame: 'assets/enemies/enemy7_jump.png',
      animMode: 'step', jumpStrength: -15, dropsBullet: 7,
    },
    8: {
      name: 'Impostor Syndrome',
      width: 100, height: 100, baseSpeed: 0.5, baseHealth: 100,
      frames: ['assets/enemies/enemy8_1.png', 'assets/enemies/enemy8_2.png'],
      animMode: 'step', jumpStrength: 0, dropsBullet: 8,
    },
  },
  sprites: {
    player:     'assets/player/player_idle.png',
    playerWalk: [
      'assets/player/player_walking_1.png',
      'assets/player/player_idle.png',
      'assets/player/player_walking_2.png',
      'assets/player/player_idle.png',
    ],
    playerJump:  'assets/player/player_jump.png',
    playerThrow: 'assets/player/player_throw.png',
    platform:    'assets/environment/platform.png',
  },
  waves: { startEnemies: 3, coolDownMs: 2000 },
  platforms: [
    { x: 75,  y: 454, width: 300, height: 30 },
    { x: 460, y: 421, width: 300, height: 30 },
    { x: 465, y: 306, width: 300, height: 30 },
    { x: 53,  y: 277, width: 300, height: 30 },
    { x: 320, y: 162, width: 300, height: 30 },
  ],
  // ---- ASSET SLOTS ----
  // Set any null to a file path string to enable it.
  assets: {
    healthPickup:   null, // 'assets/items/health.png'     — replaces the procedural green cross
    menuBackground: null, // 'assets/ui/menu_bg.png'       — replaces the dim overlay on menu
    // One background per wave (wraps if waves exceed array length):
    backgrounds: [
      'assets/environment/background1.png',
      // 'assets/environment/background2.png',
      // 'assets/environment/background3.png',
    ],
    // UI sprites:
    lifeIcon:       null, // 'assets/ui/life.png'          — replaces the coloured circle
    bulletSlotBg:   null, // 'assets/ui/bullet_slot.png'   — frame drawn behind each bullet slot
  },
  // ---- LIMITS ----
  limits: {
    maxBulletsOnScreen: 15,  // prevents bullet-spam lag
    maxDamageNumbers:   20,  // keeps floating text manageable
  },
};

// ======= DAMAGE MATRIX =======
// Row = bullet type, Col = enemy type
// Each bullet strongly counters its matching enemy number
const DAMAGE_MATRIX = {
  1: { 1: 15, 2:  1, 3:  5, 4:  5, 5:  5, 6:  5, 7:  5, 8:  3 },
  2: { 1:  1, 2: 20, 3:  5, 4:  5, 5:  5, 6:  5, 7:  5, 8:  3 },
  3: { 1:  5, 2:  5, 3: 20, 4:  5, 5:  5, 6:  5, 7:  5, 8:  5 },
  4: { 1:  5, 2:  5, 3:  5, 4: 20, 5:  5, 6:  5, 7:  5, 8:  5 },
  5: { 1:  8, 2:  8, 3:  8, 4:  8, 5: 25, 6:  8, 7:  8, 8: 10 },
  6: { 1:  8, 2:  8, 3:  8, 4:  8, 5:  8, 6: 25, 7:  8, 8: 12 },
  7: { 1: 10, 2: 10, 3: 10, 4: 10, 5: 10, 6: 10, 7: 25, 8: 15 },
  8: { 1: 10, 2: 10, 3: 10, 4: 10, 5: 10, 6: 10, 7: 10, 8: 25 },
};

// ======= Assets =======
const IMAGES = {
  player: new Image(), playerWalk: [],
  playerJump: new Image(), playerThrow: new Image(),
  platform: new Image(), bullets: {}, enemies: {},
};

function preloadImages(onAllLoaded) {
  const toLoad = [];

  IMAGES.player.src    = CONFIG.sprites.player;
  IMAGES.playerJump.src  = CONFIG.sprites.playerJump;
  IMAGES.playerThrow.src = CONFIG.sprites.playerThrow;
  IMAGES.platform.src  = CONFIG.sprites.platform;
  toLoad.push(IMAGES.player, IMAGES.playerJump, IMAGES.playerThrow, IMAGES.platform);

  CONFIG.sprites.playerWalk.forEach(src => {
    const img = new Image(); img.src = src;
    IMAGES.playerWalk.push(img); toLoad.push(img);
  });

  for (const [type, info] of Object.entries(CONFIG.bullets)) {
    const img = new Image(); img.src = info.src;
    IMAGES.bullets[type] = img; toLoad.push(img);
  }

  for (const [type, info] of Object.entries(CONFIG.enemies)) {
    const frames = [];
    for (const src of info.frames) {
      const img = new Image(); img.src = src;
      frames.push(img); toLoad.push(img);
    }
    IMAGES.enemies[type] = frames;
    if (info.jumpFrame) {
      const img = new Image(); img.src = info.jumpFrame;
      IMAGES.enemies[type].jumpFrame = img; toLoad.push(img);
    }
  }

  let loaded = 0;
  toLoad.forEach(img => {
    img.onload = img.onerror = () => { if (++loaded === toLoad.length) onAllLoaded(); };
  });
}

// ======= Helpers =======
function aabbOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function isOnPlatform(px, py, pw, ph, platforms) {
  for (const plat of platforms) {
    if (py + ph >= plat.y && py + ph <= plat.y + plat.height + 4 &&
        px + pw > plat.x && px < plat.x + plat.width) {
      return plat.y - ph;
    }
  }
  return null;
}

// ======= Classes =======

class DamageNumber {
  constructor(x, y, amount, color) {
    this.x = x + (Math.random() - 0.5) * 20;
    this.y = y;
    this.amount = amount;
    this.vy = -2;
    this.life = 1.0;
    this.color = color ?? (amount >= 20 ? '#FFD700' : amount >= 10 ? '#FF6B35' : '#AADDFF');
  }
  update(dt) {
    this.y  += this.vy * dt;
    this.vy += 0.06 * dt;
    this.life -= 0.025 * dt;
  }
  draw(ctx) {
    if (this.life <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.font = `bold ${12 + Math.floor(this.life * 6)}px Arial`;
    ctx.lineWidth = 3; ctx.strokeStyle = 'black';
    ctx.strokeText(this.amount, this.x, this.y);
    ctx.fillStyle = this.color;
    ctx.fillText(this.amount, this.x, this.y);
    ctx.restore();
  }
  isDead() { return this.life <= 0; }
}

class HealthPickup {
  constructor(x, y) {
    this.x = x; this.baseY = y; this.y = y;
    this.width = 20; this.height = 20;
    this.time = Math.random() * Math.PI * 2;
    this.collected = false;
    this.healAmount = 25;
  }
  update(dt) {
    this.time += 0.05 * dt;
    this.y = this.baseY + Math.sin(this.time) * 6;
  }
  draw(ctx) {
    if (this.collected) return;
    ctx.save();
    ctx.shadowColor = '#00FF88';
    ctx.shadowBlur = 12 + Math.sin(this.time * 2) * 4;
    ctx.fillStyle = '#00FF88';
    const cx = this.x + this.width / 2, cy = this.y + this.height / 2;
    ctx.fillRect(cx - 3, cy - 9, 6, 18);
    ctx.fillRect(cx - 9, cy - 3, 18, 6);
    ctx.restore();
  }
  overlaps(px, py, pw, ph) {
    return aabbOverlap(this.x, this.y, this.width, this.height, px, py, pw, ph);
  }
}

class BulletPickup {
  constructor(x, y, type) {
    this.x = x; this.baseY = y; this.y = y;
    this.type = type;
    this.width = 24; this.height = 24;
    this.time = Math.random() * Math.PI * 2;
    this.collected = false;
  }
  update(dt) {
    this.time += 0.05 * dt;
    this.y = this.baseY + Math.sin(this.time) * 6;
  }
  draw(ctx) {
    if (this.collected) return;
    ctx.save();
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 12 + Math.sin(this.time * 2) * 5;
    const img = IMAGES.bullets[this.type];
    if (img) ctx.drawImage(img, this.x, this.y, this.width, this.height);
    ctx.restore();
  }
  overlaps(px, py, pw, ph) {
    return aabbOverlap(this.x, this.y, this.width, this.height, px, py, pw, ph);
  }
}

class Body {
  constructor(x, y, w, h) { this.x = x; this.y = y; this.width = w; this.height = h; this.velY = 0; }
}

class Bullet {
  constructor(x, y, dir, type) {
    const spec = CONFIG.bullets[type] || CONFIG.bullets[1];
    this.type = type; this.x = x; this.y = y; this.dir = dir;
    this.width = spec.width; this.height = spec.height;
    this.speed = spec.speed; this.dead = false;
  }
  update(dt) { this.x += this.dir * this.speed * dt; }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.dir === -1) {
      ctx.scale(-1, 1);
      ctx.drawImage(IMAGES.bullets[this.type], -this.width, 0, this.width, this.height);
    } else {
      ctx.drawImage(IMAGES.bullets[this.type], 0, 0, this.width, this.height);
    }
    ctx.restore();
  }
  isOffscreen() { return this.x < -this.width || this.x > canvas.width + this.width; }
}

class Enemy extends Body {
  constructor(x, y, type, wave) {
    const spec = CONFIG.enemies[type];
    super(x, y, spec.width, spec.height);
    this.type = type;
    this.speed = spec.baseSpeed + wave * 0.2;
    this.jumpStrength = spec.jumpStrength ?? 0;
    this.health = spec.baseHealth;
    this.maxHealth = spec.baseHealth;
    this.dead = false;

    this.frames = IMAGES.enemies[type] || [];
    this.animMode = spec.animMode || 'static';
    this.jumpFrame = IMAGES.enemies[type]?.jumpFrame || null;

    this.currentFrame = 0;
    this.nextFrame = this.frames.length > 1 ? 1 : 0;
    this.frameTimer = 0;
    this.frameInterval = spec.animationInterval || 300;
    this.blendProgress = 0;
    this.isFacingLeft = false;
    this.jumpCooldown = 0;
  }

  updateAnimation(dt) {
    if (this.animMode === 'static' || this.frames.length <= 1) return;
    this.frameTimer += dt * 16.667;
    if (this.animMode === 'fade') {
      if (this.frameTimer >= this.frameInterval) {
        this.frameTimer = 0;
        this.currentFrame = this.nextFrame;
        this.nextFrame = (this.nextFrame + 1) % this.frames.length;
        this.blendProgress = 0;
      } else {
        this.blendProgress = this.frameTimer / this.frameInterval;
      }
    } else if (this.animMode === 'step') {
      if (this.frameTimer >= this.frameInterval) {
        this.frameTimer = 0;
        this.currentFrame = (this.currentFrame + 1) % this.frames.length;
      }
    }
  }

  tryJumpAtPlayer(player) {
    if (this.jumpStrength === 0 || this.jumpCooldown > 0 || this.velY !== 0) return;
    if (player.y < this.y) {
      this.velY = this.jumpStrength;
      this.jumpCooldown = 120;
    }
  }

  draw(ctx) {
    if (this.dead || this.health <= 0) return;
    if (!this.frames.length) return;

    ctx.save();
    if (this.isFacingLeft) {
      ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
      ctx.scale(-1, 1);
      ctx.translate(-this.width / 2, -this.height / 2);
    } else {
      ctx.translate(this.x, this.y);
    }

    if (this.velY !== 0 && this.jumpFrame) {
      ctx.drawImage(this.jumpFrame, 0, 0, this.width, this.height);
    } else if (this.animMode === 'fade' && this.frames.length > 1) {
      ctx.globalAlpha = 1 - this.blendProgress;
      ctx.drawImage(this.frames[this.currentFrame], 0, 0, this.width, this.height);
      ctx.globalAlpha = this.blendProgress;
      ctx.drawImage(this.frames[this.nextFrame],    0, 0, this.width, this.height);
      ctx.globalAlpha = 1;
    } else {
      const img = this.frames[this.currentFrame];
      if (img) ctx.drawImage(img, 0, 0, this.width, this.height);
    }

    // Mini health bar (only when damaged)
    if (this.health < this.maxHealth) {
      const bw = this.width;
      ctx.fillStyle = '#333'; ctx.fillRect(0, -10, bw, 5);
      ctx.fillStyle = `hsl(${(this.health / this.maxHealth) * 120},100%,45%)`;
      ctx.fillRect(0, -10, bw * (this.health / this.maxHealth), 5);
    }

    ctx.restore();
  }
}

class Player extends Body {
  constructor(x, y) {
    super(x, y, CONFIG.player.width, CONFIG.player.height);
    this.baseSpeed = CONFIG.player.speed;
    this.speed = this.baseSpeed;
    this.facingLeft = false;
    this.isFlickering = false;
    this.isJumping = false;
    this.movingHorizontally = false;
    this.touchStartTime = null;
    this.flickerStartTime = null;
    this.hp = CONFIG.player.maxHP;
    this.lives = CONFIG.player.lives;
    this.invulnUntil = 0;
    this.lastHurtAt = 0;
    this.throwUntil = 0;
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.frameInterval = 120;
  }

  setThrow() { this.throwUntil = performance.now() + 250; }
  isThrowing() { return performance.now() < this.throwUntil; }

  updateAnimation(dt) {
    if (this.movingHorizontally) {
      this.frameTimer += dt * 16.667;
      if (this.frameTimer > this.frameInterval) {
        this.frameTimer = 0;
        this.currentFrame = (this.currentFrame + 1) % IMAGES.playerWalk.length;
      }
    } else {
      this.currentFrame = 0; this.frameTimer = 0;
    }
  }

  draw(ctx) {
    const now = performance.now();
    const invuln = now < this.invulnUntil;
    const tick = Math.floor(now / 100) % 2 === 0;
    if (this.isFlickering && !tick) return;
    if (invuln && !tick) return;

    let sprite;
    if (this.isThrowing()) sprite = IMAGES.playerThrow;
    else if (this.isJumping)  sprite = IMAGES.playerJump;
    else if (this.movingHorizontally) sprite = IMAGES.playerWalk[this.currentFrame] || IMAGES.player;
    else sprite = IMAGES.player;

    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.facingLeft) {
      ctx.scale(-1, 1);
      ctx.drawImage(sprite, -this.width, 0, this.width, this.height);
    } else {
      ctx.drawImage(sprite, 0, 0, this.width, this.height);
    }
    ctx.restore();
  }

  applyGravity(dt) {
    this.velY += CONFIG.player.gravity * dt;
    this.y    += this.velY * dt;
  }

  updateFlicker(touch) {
    const { holdMs, durationMs, slowFactor } = CONFIG.player.flicker;
    const now = performance.now();
    if (touch) {
      if (!this.touchStartTime) this.touchStartTime = now;
      if (!this.isFlickering && now - this.touchStartTime >= holdMs) {
        this.isFlickering = true;
        this.flickerStartTime = now;
        this.speed = this.baseSpeed * slowFactor;
      }
    } else {
      this.touchStartTime = null;
    }
    if (this.isFlickering && now - this.flickerStartTime >= durationMs) {
      this.isFlickering = false;
      this.speed = this.baseSpeed;
    }
  }

  takeTouchDamage() {
    const now = performance.now();
    if (now < this.invulnUntil) return false;
    if (now - this.lastHurtAt >= CONFIG.combat.touchDamageCooldown) {
      this.hp -= CONFIG.combat.touchDamage;
      this.lastHurtAt = now;
      return true;
    }
    return false;
  }

  setInvulnerableForRespawn() {
    this.invulnUntil = performance.now() + CONFIG.player.respawnInvulnMs;
  }
}

// ======= Game Controller =======
class Game {
  constructor(ctx) {
    this.ctx = ctx;
    this.keys = {};
    this.canJump = true;
    this.platforms = CONFIG.platforms;
    this.player = new Player(375, CONFIG.player.groundY);
    this.bullets = [];
    this.enemies = [];
    this.pickups = [];
    this.healthPickups = [];
    this.damageNumbers = [];
    this.unlockedBullets = new Set([1]);
    this.currentBullet = 1;
    this.wave = 0;
    this.spawner = null;
    this.score = 0;
    this.state = STATE.MENU;
    this.lastWaveTime = 0;
    this.lastTimestamp = 0;
    this._wireInputs();
  }

  _wireInputs() {
    const prevent = ['arrowleft','arrowright','arrowup',' ','w','a','s','d','x','enter'];
    document.addEventListener('keydown', e => {
      const k = e.key.toLowerCase();
      this.keys[k] = true;
      if (prevent.includes(k)) e.preventDefault();

      if (this.state === STATE.MENU) {
        if (k === 'enter' || k === ' ') this._startGame();
        if (k === 't') this.state = STATE.TUTORIAL;
        return;
      }
      if (this.state === STATE.TUTORIAL) {
        if (k === 'enter' || k === 'escape') this.state = STATE.MENU;
        return;
      }
      if (this.state === STATE.GAME_OVER) {
        if (k === 'enter' || k === ' ') this._startGame();
        if (k === 'm') this.state = STATE.MENU;
        return;
      }
      if (this.state === STATE.PLAYING) {
        if (k === 'arrowleft' || k === 'a') this.player.facingLeft = true;
        if (k === 'arrowright'|| k === 'd') this.player.facingLeft = false;
        if ((k === ' ' || k === 'arrowup' || k === 'w') && this._isGrounded() && this.canJump) {
          this.player.velY = CONFIG.player.jumpStrength;
          this.canJump = false;
        }
        if (!this.player.isFlickering && (k === 'x' || k === 'enter')) this._shoot();
        if (k === 'c') this._cycleBullet();
      }
    });
    document.addEventListener('keyup', e => {
      const k = e.key.toLowerCase();
      this.keys[k] = false;
      if (k === ' ' || k === 'arrowup' || k === 'w') this.canJump = true;
    });
  }

  _startGame() {
    this.player = new Player(375, CONFIG.player.groundY);
    this.bullets = []; this.enemies = []; this.pickups = []; this.healthPickups = []; this.damageNumbers = [];
    this.unlockedBullets = new Set([1]);
    this.currentBullet = 1;
    this.wave = 0; this.spawner = null; this.score = 0;
    this.lastWaveTime = performance.now();
    this.state = STATE.PLAYING;
    this.updateHUD();
    this.spawnWave();
  }

  _cycleBullet() {
    const unlocked = [...this.unlockedBullets].sort((a, b) => a - b);
    if (!unlocked.length) return;
    const idx = unlocked.indexOf(this.currentBullet);
    this.currentBullet = unlocked[(idx + 1) % unlocked.length];
  }

  _shoot() {
    if (!this.unlockedBullets.has(this.currentBullet)) this._cycleBullet();
    const type = this.currentBullet;
    const spec = CONFIG.bullets[type]; if (!spec) return;
    const dir = this.player.facingLeft ? -1 : 1;
    const px  = this.player.facingLeft ? this.player.x : this.player.x + this.player.width;
    const py  = this.player.y + this.player.height / 2 - spec.height / 2;
    this.bullets.push(new Bullet(px, py, dir, type));
    this.player.setThrow();
  }

  spawnWave() {
    this.wave++;
    const total    = CONFIG.waves.startEnemies + this.wave * 2;
    const maxIdx   = Math.min(this.wave - 1, Object.keys(CONFIG.enemies).length - 1);
    const available = Object.keys(CONFIG.enemies).slice(0, maxIdx + 1);
    const interval = Math.max(400, 1500 - this.wave * 100);
    this.spawner = { total, spawned: 0, available, interval, timer: 0 };
    this.lastWaveTime = performance.now();
  }

  _updateSpawner(dt) {
    if (!this.spawner) return;
    this.spawner.timer += dt * 16.667;
    if (this.spawner.timer < this.spawner.interval) return;
    this.spawner.timer = 0;

    const type = this.spawner.available[Math.floor(Math.random() * this.spawner.available.length)];
    const spec = CONFIG.enemies[type];
    const x = Math.random() < 0.5 ? -spec.width : canvas.width;
    const y = Math.min(CONFIG.player.groundY, canvas.height - spec.height);
    this.enemies.push(new Enemy(x, y, type, this.wave));

    this.spawner.spawned++;
    if (this.spawner.spawned >= this.spawner.total) this.spawner = null;
  }

  _isGrounded() {
    const { x, y, width, height, velY } = this.player;
    if (y >= CONFIG.player.groundY && velY >= 0) return true;
    return isOnPlatform(x, y, width, height, this.platforms) !== null && velY >= 0;
  }

  _movePlayerHorizontal(dt) {
    const left  = this.keys['arrowleft'] || this.keys['a'];
    const right = this.keys['arrowright'] || this.keys['d'];
    this.player.movingHorizontally = !!(left || right);
    if (left)  { this.player.x -= this.player.speed * dt; this.player.facingLeft = true;  }
    if (right) { this.player.x += this.player.speed * dt; this.player.facingLeft = false; }
    this.player.x = clamp(this.player.x, 0, canvas.width - this.player.width);
  }

  _applyPlayerPhysics(dt) {
    this.player.applyGravity(dt);
    const platY = isOnPlatform(this.player.x, this.player.y, this.player.width, this.player.height, this.platforms);
    if (platY !== null && this.player.velY >= 0) { this.player.y = platY; this.player.velY = 0; }
    if (this.player.y >= CONFIG.player.groundY)  { this.player.y = CONFIG.player.groundY; this.player.velY = 0; }
    this.player.isJumping = this.player.y < CONFIG.player.groundY &&
      isOnPlatform(this.player.x, this.player.y, this.player.width, this.player.height, this.platforms) === null;
  }

  _updateEnemiesAI(dt) {
    for (const e of this.enemies) {
      if (e.dead || e.health <= 0) continue;

      const deadZone = e.width / 4;
      let moved = false;

      if (this.player.x < e.x - deadZone) {
        e.x -= e.speed * dt; e.isFacingLeft = true;  moved = true;
      } else if (this.player.x > e.x + deadZone) {
        e.x += e.speed * dt; e.isFacingLeft = false; moved = true;
      }

      if (e.jumpCooldown > 0) e.jumpCooldown -= dt;
      e.tryJumpAtPlayer(this.player);

      e.velY += CONFIG.player.gravity * dt;
      e.y    += e.velY * dt;

      const groundY = Math.min(CONFIG.player.groundY, canvas.height - e.height);
      if (e.y >= groundY) { e.y = groundY; e.velY = 0; }

      const platY = isOnPlatform(e.x, e.y, e.width, e.height, this.platforms);
      if (platY !== null && e.velY >= 0) { e.y = platY; e.velY = 0; }

      e.x = clamp(e.x, 0, canvas.width - e.width);

      if (moved || e.animMode === 'fade') e.updateAnimation(dt);
    }
  }

  _updateBullets(dt) {
    for (const b of this.bullets) b.update(dt);
    this.bullets = this.bullets.filter(b => !b.isOffscreen() && !b.dead);
  }

  _bulletEnemyCollisions() {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i]; if (b.dead) continue;
      for (const e of this.enemies) {
        if (e.dead || e.health <= 0) continue;
        if (!aabbOverlap(b.x, b.y, b.width, b.height, e.x, e.y, e.width, e.height)) continue;

        const dmg = (DAMAGE_MATRIX[b.type]?.[e.type]) || 0;
        e.health -= dmg;
        this.damageNumbers.push(new DamageNumber(e.x + e.width / 2, e.y, dmg));

        if (e.health <= 0) {
          e.dead = true;
          this.score += 10;
          this.updateHUD();
          this._onEnemyKilled(e);
        }
        b.dead = true; break;
      }
    }
    this.bullets = this.bullets.filter(b => !b.dead);
  }

  _onEnemyKilled(e) {
    const dropY = Math.min(e.y, CONFIG.player.groundY - 30);
    const cx = e.x + e.width / 2;

    const bulletType = CONFIG.enemies[e.type]?.dropsBullet;
    if (bulletType && !this.unlockedBullets.has(bulletType)) {
      this.pickups.push(new BulletPickup(cx - 12, dropY, bulletType));
    }

    // Boss always drops health; other enemies have 30% chance
    const isBoss = e.type == 8;
    if (isBoss || Math.random() < 0.30) {
      this.healthPickups.push(new HealthPickup(cx - 10, dropY - (bulletType && !this.unlockedBullets.has(bulletType) ? 30 : 0)));
    }
  }

  _updatePickups(dt) {
    for (const p of this.pickups) {
      p.update(dt);
      if (!p.collected && p.overlaps(this.player.x, this.player.y, this.player.width, this.player.height)) {
        p.collected = true;
        this.unlockedBullets.add(p.type);
      }
    }
    this.pickups = this.pickups.filter(p => !p.collected);
  }

  _updateHealthPickups(dt) {
    for (const h of this.healthPickups) {
      h.update(dt);
      if (!h.collected && h.overlaps(this.player.x, this.player.y, this.player.width, this.player.height)) {
        h.collected = true;
        const gained = Math.min(h.healAmount, CONFIG.player.maxHP - this.player.hp);
        this.player.hp += gained;
        if (gained > 0) {
          this.damageNumbers.push(new DamageNumber(
            this.player.x + this.player.width / 2, this.player.y - 10, '+' + gained, '#00FF88'
          ));
        }
      }
    }
    this.healthPickups = this.healthPickups.filter(h => !h.collected);
  }

  _playerEnemyContact() {
    let touching = false;
    for (const e of this.enemies) {
      if (e.dead || e.health <= 0) continue;
      if (!aabbOverlap(this.player.x, this.player.y, this.player.width, this.player.height, e.x, e.y, e.width, e.height)) continue;
      touching = true;
      const damaged = this.player.takeTouchDamage();
      if (damaged && this.player.hp <= 0) {
        this.player.lives--;
        this.updateHUD();
        if (this.player.lives > 0) {
          this.player.hp = CONFIG.player.maxHP;
          this.player.setInvulnerableForRespawn();
        } else {
          this.state = STATE.GAME_OVER;
        }
      }
    }
    this.player.updateFlicker(touching);
  }

  _maybeSpawnNextWave() {
    if (this.spawner) return;
    const hasLive = this.enemies.some(e => !e.dead && e.health > 0);
    if (hasLive) { this.lastWaveTime = performance.now(); return; }
    if (performance.now() - this.lastWaveTime >= CONFIG.waves.coolDownMs) this.spawnWave();
  }

  update(dt) {
    this._movePlayerHorizontal(dt);
    this._applyPlayerPhysics(dt);
    this.player.updateAnimation(dt);
    this._updateEnemiesAI(dt);
    this._updateBullets(dt);
    this._bulletEnemyCollisions();
    this._playerEnemyContact();
    this._updatePickups(dt);
    this._updateHealthPickups(dt);
    this._updateSpawner(dt);
    this._maybeSpawnNextWave();
    for (const d of this.damageNumbers) d.update(dt);
    this.damageNumbers = this.damageNumbers.filter(d => !d.isDead());
    this.enemies = this.enemies.filter(e => !e.dead);
  }

  // ===== Draw helpers =====

  _drawPlatforms() {
    for (const p of this.platforms) ctx.drawImage(IMAGES.platform, p.x, p.y, p.width, p.height);
  }

  _drawHUD() {
    const cx = this.ctx;

    // HP bar
    cx.fillStyle = '#333'; cx.fillRect(15, 15, 150, 16);
    const hpFrac = Math.max(0, this.player.hp) / CONFIG.player.maxHP;
    cx.fillStyle = `hsl(${hpFrac * 120},100%,45%)`; cx.fillRect(15, 15, 150 * hpFrac, 16);
    cx.strokeStyle = 'white'; cx.lineWidth = 1; cx.strokeRect(15, 15, 150, 16);
    cx.fillStyle = 'white'; cx.font = '12px Arial';
    cx.fillText(`HP: ${Math.max(0,this.player.hp)}/${CONFIG.player.maxHP}`, 18, 27);

    // Lives beside HP bar (filled/empty circles)
    cx.font = 'bold 16px Arial';
    let lx = 172;
    for (let i = 0; i < CONFIG.player.lives; i++) {
      cx.fillStyle = i < this.player.lives ? '#FF4466' : '#444';
      cx.beginPath();
      cx.arc(lx, 23, 6, 0, Math.PI * 2);
      cx.fill();
      lx += 18;
    }

    // Wave label
    cx.fillStyle = 'white'; cx.font = '14px Arial'; cx.textAlign = 'center';
    cx.fillText(`Wave ${this.wave}`, canvas.width / 2, 24);
    cx.textAlign = 'left';

    // Bullet bar (bottom)
    const slotSize = 32, gap = 4;
    const types = [1,2,3,4,5,6,7,8];
    const totalW = types.length * (slotSize + gap) - gap;
    let bx = (canvas.width - totalW) / 2;
    const by = canvas.height - slotSize - 10;

    for (const t of types) {
      const unlocked = this.unlockedBullets.has(t);
      const active   = t === this.currentBullet;
      cx.save();
      cx.globalAlpha = unlocked ? 1.0 : 0.25;
      if (active && unlocked) {
        cx.shadowColor = '#FFD700'; cx.shadowBlur = 12;
        cx.strokeStyle = '#FFD700'; cx.lineWidth = 2;
        cx.strokeRect(bx - 1, by - 1, slotSize + 2, slotSize + 2);
      }
      if (IMAGES.bullets[t]) cx.drawImage(IMAGES.bullets[t], bx, by, slotSize, slotSize);
      if (!unlocked) {
        cx.globalAlpha = 0.6;
        cx.fillStyle = '#000'; cx.fillRect(bx, by, slotSize, slotSize);
        cx.globalAlpha = 1; cx.fillStyle = 'white'; cx.font = 'bold 16px Arial';
        cx.fillText('?', bx + slotSize / 2 - 5, by + slotSize / 2 + 6);
      }
      cx.restore();
      bx += slotSize + gap;
    }
  }

  _drawScene() {
    this._drawPlatforms();
    for (const p of this.pickups)       p.draw(this.ctx);
    for (const h of this.healthPickups) h.draw(this.ctx);
    for (const b of this.bullets)       b.draw(this.ctx);
    for (const e of this.enemies)     e.draw(this.ctx);
    this.player.draw(this.ctx);
    for (const d of this.damageNumbers) d.draw(this.ctx);
    this._drawHUD();
  }

  _drawMenu() {
    const cx = this.ctx;
    cx.fillStyle = 'rgba(0,0,0,0.72)'; cx.fillRect(0, 0, canvas.width, canvas.height);

    // Art placeholder box
    cx.strokeStyle = 'rgba(255,255,255,0.15)'; cx.lineWidth = 1;
    cx.strokeRect(60, 30, canvas.width - 120, 270);
    cx.fillStyle = 'rgba(255,255,255,0.04)'; cx.fillRect(60, 30, canvas.width - 120, 270);
    cx.fillStyle = 'rgba(255,255,255,0.25)'; cx.font = 'italic 15px Arial'; cx.textAlign = 'center';
    cx.fillText('[ Art coming soon ]', canvas.width / 2, 170);

    cx.fillStyle = '#FFD700'; cx.font = 'bold 52px Arial';
    cx.fillText('SHOOTER', canvas.width / 2, 360);

    cx.fillStyle = 'white'; cx.font = '22px Arial';
    cx.fillText('Press  ENTER  to Play', canvas.width / 2, 418);

    cx.fillStyle = '#999'; cx.font = '16px Arial';
    cx.fillText('Press  T  for Tutorial', canvas.width / 2, 455);
    cx.textAlign = 'left';
  }

  _drawTutorial() {
    const cx = this.ctx;
    cx.fillStyle = 'rgba(0,0,0,0.88)'; cx.fillRect(0, 0, canvas.width, canvas.height);

    const header = (txt, y) => {
      cx.fillStyle = '#FFD700'; cx.font = 'bold 17px Arial'; cx.textAlign = 'left';
      cx.fillText(txt, 50, y);
    };
    const row = (label, value, y) => {
      cx.fillStyle = '#AAA'; cx.font = '14px Arial';
      cx.fillText(label, 65, y);
      if (value) { cx.fillStyle = 'white'; cx.fillText(value, 240, y); }
    };

    cx.fillStyle = '#FFD700'; cx.font = 'bold 28px Arial'; cx.textAlign = 'center';
    cx.fillText('HOW TO PLAY', canvas.width / 2, 42);
    cx.textAlign = 'left';

    let y = 75;
    header('CONTROLS', y); y += 22;
    row('Move',         'Arrow Keys  /  WASD', y); y += 20;
    row('Jump',         'Space  /  W  /  Up Arrow', y); y += 20;
    row('Shoot',        'X  /  Enter', y); y += 20;
    row('Cycle Bullet', 'C', y); y += 28;

    header('BULLET AFFINITIES', y); y += 22;
    // Two-column layout: left = bullets 1-4, right = bullets 5-8
    const col2 = 420;
    const pairs = [
      ['Bullet 1  ->  Hate',        'Bullet 5  ->  Ignorance'],
      ['Bullet 2  ->  Void',        'Bullet 6  ->  Lethargy'],
      ['Bullet 3  ->  Thoughtless', 'Bullet 7  ->  Papa Fish'],
      ['Bullet 4  ->  Blind',       'Bullet 8  ->  Impostor Syndrome'],
    ];
    for (const [left, right] of pairs) {
      cx.fillStyle = '#CCC'; cx.font = '14px Arial';
      cx.fillText(left,  65,    y);
      cx.fillText(right, col2,  y);
      y += 20;
    }
    y += 8;
    // Draw bullet icons row
    const types = [1,2,3,4,5,6,7,8];
    const bSlot = 28;
    let bx = 65;
    for (const t of types) {
      if (IMAGES.bullets[t]) cx.drawImage(IMAGES.bullets[t], bx, y - 6, bSlot, bSlot);
      bx += bSlot + 4;
    }
    y += bSlot + 6;

    header('UNLOCKING BULLETS', y); y += 22;
    cx.fillStyle = '#CCC'; cx.font = '14px Arial';
    cx.fillText('Kill enemies - they drop their matching bullet.', 65, y); y += 19;
    cx.fillText('Walk over the glowing bullet to unlock it!', 65, y); y += 28;

    header('SURVIVAL', y); y += 22;
    cx.fillStyle = '#CCC'; cx.font = '14px Arial';
    cx.fillText('Enemies get faster each wave.  You have 3 lives.', 65, y); y += 19;
    cx.fillText('Contact damage every 0.5 sec.  Use the right bullet!', 65, y);

    cx.fillStyle = '#666'; cx.font = '15px Arial'; cx.textAlign = 'center';
    cx.fillText('Press  ENTER  or  ESC  to return', canvas.width / 2, canvas.height - 16);
    cx.textAlign = 'left';
  }

  _drawGameOver() {
    const cx = this.ctx;
    cx.fillStyle = 'rgba(0,0,0,0.55)'; cx.fillRect(0, 0, canvas.width, canvas.height);
    cx.fillStyle = 'red'; cx.font = 'bold 52px Arial'; cx.textAlign = 'center';
    cx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
    cx.fillStyle = 'white'; cx.font = '22px Arial';
    cx.fillText(`Score: ${this.score}`, canvas.width / 2, canvas.height / 2 + 30);
    cx.fillStyle = '#AAA'; cx.font = '16px Arial';
    cx.fillText('ENTER - Play Again', canvas.width / 2, canvas.height / 2 + 65);
    cx.fillText('M - Main Menu', canvas.width / 2, canvas.height / 2 + 90);
    cx.textAlign = 'left';
  }

  frame(timestamp) {
    const raw = timestamp - (this.lastTimestamp || timestamp);
    this.lastTimestamp = timestamp;
    // Normalize to 60fps, cap at ~3 frames to prevent spiral-of-death
    const dt = Math.min(raw, 50) / 16.667;

    const cx = this.ctx;
    cx.clearRect(0, 0, canvas.width, canvas.height);

    if (this.state === STATE.MENU) {
      this._drawMenu();
    } else if (this.state === STATE.TUTORIAL) {
      this._drawTutorial();
    } else if (this.state === STATE.PLAYING) {
      this.update(dt);
      this._drawScene();
    } else if (this.state === STATE.GAME_OVER) {
      this._drawScene();
      this._drawGameOver();
    }

    requestAnimationFrame(ts => this.frame(ts));
  }

  updateHUD() {
    const scoreEl = document.getElementById('score');
    const livesEl = document.getElementById('lives');
    if (scoreEl) scoreEl.textContent = `Score: ${this.score}`;
    if (livesEl) livesEl.textContent = `Lives: ${Math.max(0, this.player.lives)}`;
  }
}

// ======= Boot =======
preloadImages(() => {
  const game = new Game(ctx);
  requestAnimationFrame(ts => game.frame(ts));
});
