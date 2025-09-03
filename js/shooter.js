// ===== Canvas & Context =====
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ===== HUD (outside canvas) =====
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');

// ======= CONFIG =======
const CONFIG = {
  player: {
    width: 50,
    height: 50,
    speed: 5,
    jumpStrength: -10,
    gravity: 0.3,
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
    1: { width: 20, height: 20, speed: 6, src: 'assets/bullets/bullet1.png' },
    2: { width: 20, height: 20, speed: 6, src: 'assets/bullets/bullet2.png' },
    3: { width: 20, height: 20, speed: 7, src: 'assets/bullets/bullet3.png' },
    4: { width: 20, height: 20, speed: 7, src: 'assets/bullets/bullet4.png' },
    5: { width: 20, height: 20, speed: 8, src: 'assets/bullets/bullet5.png' },
    6: { width: 20, height: 20, speed: 9, src: 'assets/bullets/bullet6.png' },
    7: { width: 20, height: 20, speed: 10, src: 'assets/bullets/bullet7.png' },
    8: { width: 20, height: 20, speed: 12, src: 'assets/bullets/bullet8.png' },
  },
  bulletTypes: [1, 2, 3, 4, 5, 6, 7, 8],
  enemies: {
    1: {
      width: 50, height: 50, baseSpeed: 1.2, baseHealth: 10,
      frames: ['assets/enemies/PHenemy.png'],
      animMode: "static"   // no animation
    },
    2: {
      width: 50, height: 50, baseSpeed: 1.0, baseHealth: 15,
      frames: [
        'assets/enemies/enemy2_1.png',
        'assets/enemies/enemy2_2.png',
      ],
      animMode: "fade",    // smooth crossfade animation
      animationInterval: 500
    },
    3: {
      width: 50, height: 50, baseSpeed: 1.0, baseHealth: 15,
      frames: [
        'assets/enemies/enemy3_1.png',
        'assets/enemies/enemy3_2.png',
      ],
      animMode: "step",    // step animation
    }
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
    platform: 'assets/environment/PHplatform.png'
  },
  waves: {
    startEnemies: 3,
    coolDownMs: 2000,
    enemyJumpStrength: -8
  },
  platforms: [
    { x: 0, y: 500, width: 200, height: 30 },
    { x: 200, y: 400, width: 200, height: 30 },
    { x: 600, y: 300, width: 200, height: 30 },
  ]
};

// ======= DAMAGE MATRIX ======= 
const DAMAGE_MATRIX = {
  1: { 1: 5, 2: 1, 3: 10 },
  2: { 1: 1, 2: 10, 3: 10 },
  3: { 1: 10, 2: 10, 3: 10 },
  4: { 1: 10, 2: 10, 3: 10 },
  5: { 1: 10, 2: 10, 3: 10 },
  6: { 1: 10, 2: 10, 3: 10 },
  7: { 1: 10, 2: 10, 3: 10 },
  8: { 1: 10, 2: 10, 3: 10 }
};

// ======= Assets =======
const IMAGES = { player: new Image(), platform: new Image(), bullets: {}, enemies: {} };

function preloadImages(onAllLoaded) {
  const toLoad = [];

  // player + platform
  IMAGES.player.src = CONFIG.sprites.player;
  IMAGES.platform.src = CONFIG.sprites.platform;
  toLoad.push(IMAGES.player, IMAGES.platform);

  // bullets (unchanged)
  for (const [type, info] of Object.entries(CONFIG.bullets)) {
    const img = new Image();
    img.src = info.src;
    IMAGES.bullets[type] = img;
    toLoad.push(img);
  }

  // enemies: load EACH frame into an Image[], not a single Image
  for (const [type, info] of Object.entries(CONFIG.enemies)) {
    const frames = [];
    for (const src of info.frames) {
      const img = new Image();
      img.src = src;
      frames.push(img);
      toLoad.push(img);
    }
    IMAGES.enemies[type] = frames; // array of HTMLImageElement
  }

  // gate start until everything has either loaded or errored
  let loaded = 0;
  toLoad.forEach(img => {
    img.onload = img.onerror = () => {
      loaded++;
      if (loaded === toLoad.length) onAllLoaded();
    };
  });
}


// ======= Helpers =======
function aabbOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function isOnPlatform(px, py, pw, ph, platforms) {
  for (let plat of platforms) {
    if (py + ph >= plat.y && py + ph <= plat.y + plat.height &&
      px + pw > plat.x && px < plat.x + plat.width) {
      return plat.y - ph;
    }
  }
  return null;
}

// ======= Classes =======
class Body { constructor(x, y, w, h) { this.x = x; this.y = y; this.width = w; this.height = h; this.velY = 0; } }

class Bullet {
  constructor(x, y, dir, type) {
    const spec = CONFIG.bullets[type] || CONFIG.bullets[1];
    this.type = type;
    this.x = x; this.y = y; this.dir = dir;
    this.width = spec.width; this.height = spec.height;
    this.speed = spec.speed; this.dead = false;
  }
  update() { this.x += this.dir * this.speed; }
  draw(ctx) {
    ctx.save(); ctx.translate(this.x, this.y);
    if (this.dir === -1) { ctx.scale(-1, 1); ctx.drawImage(IMAGES.bullets[this.type], -this.width, 0, this.width, this.height); }
    else ctx.drawImage(IMAGES.bullets[this.type], 0, 0, this.width, this.height);
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
    this.health = spec.baseHealth;
    this.dead = false;

    // frames are preloaded as an array of HTMLImageElement
    this.frames = IMAGES.enemies[this.type] || [];
    this.animMode = spec.animMode || "static";

    // animation state
    this.currentFrame = 0;
    this.nextFrame = this.frames.length > 1 ? 1 : 0;
    this.frameTimer = 0;
    this.frameInterval = spec.animationInterval || 300;
    this.blendProgress = 0;

    // facing direction
    this.isFacingLeft = false; // default (set true if needed in spawn logic)
  }

  updateAnimation(deltaTime) {
    if (this.animMode === "static" || this.frames.length <= 1) return;

    this.frameTimer += deltaTime;

    if (this.animMode === "fade") {
      if (this.frameTimer > this.frameInterval) {
        this.frameTimer = 0;
        this.currentFrame = this.nextFrame;
        this.nextFrame = (this.nextFrame + 1) % this.frames.length;
        this.blendProgress = 0;
      } else {
        this.blendProgress = this.frameTimer / this.frameInterval;
      }
    } else if (this.animMode === "step") {
      if (this.frameTimer > this.frameInterval) {
        this.frameTimer = 0;
        this.currentFrame = (this.currentFrame + 1) % this.frames.length;
      }
    }
  }

  applyGravity() {
    this.velY += CONFIG.player.gravity;
    this.y += this.velY;
  }

  groundClamp(groundY) {
    if (this.y >= groundY) {
      this.y = groundY;
      this.velY = 0;
    }
  }

  draw(ctx) {
    if (this.dead || this.health <= 0) return;
    if (!this.frames.length) return;

    ctx.save();

    if (this.isFacingLeft) {
      // Flip around vertical axis at enemy’s center
      ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
      ctx.scale(-1, 1);
      ctx.translate(-this.width / 2, -this.height / 2);
    } else {
      ctx.translate(this.x, this.y);
    }

    if (this.animMode === "fade" && this.frames.length > 1) {
      const imgA = this.frames[this.currentFrame];
      const imgB = this.frames[this.nextFrame];

      if (imgA instanceof HTMLImageElement && imgB instanceof HTMLImageElement) {
        ctx.globalAlpha = 1 - this.blendProgress;
        ctx.drawImage(imgA, 0, 0, this.width, this.height);

        ctx.globalAlpha = this.blendProgress;
        ctx.drawImage(imgB, 0, 0, this.width, this.height);

        ctx.globalAlpha = 1.0;
      }
    } else {
      const img = this.frames[this.currentFrame];
      if (img instanceof HTMLImageElement) {
        ctx.drawImage(img, 0, 0, this.width, this.height);
      }
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
    this.didThrow = false;
    this.touchStartTime = null;
    this.flickerStartTime = null;

    this.hp = CONFIG.player.maxHP;
    this.lives = CONFIG.player.lives;
    this.invulnUntil = 0;
    this.lastHurtAt = 0;

    // === Animation ===
    this.idleSprite = new Image();
    this.idleSprite.src = CONFIG.sprites.player;

    this.walkingSprites = [];
    CONFIG.sprites.playerWalk.forEach(src => {
      const img = new Image();
      img.src = src;
      this.walkingSprites.push(img);
    });
    this.jumpSprite = new Image();
    this.jumpSprite.src = CONFIG.sprites.playerJump;
    this.throwSprite = new Image();
    this.throwSprite.src = CONFIG.sprites.playerThrow;

    this.throwUntil = 0;

    this.currentFrame = 0;
    this.frameTimer = 0;
    this.frameInterval = 120;
  }

  setThrow() {
    this.throwUntil = Date.now() + 250; // 250ms throw window
  }

  isThrowing() {
    return Date.now() < this.throwUntil;
  }

  updateAnimation(deltaTime) {
    if (Math.abs(this.velX) > 0 || this.movingHorizontally) {
      this.frameTimer += deltaTime;
      if (this.frameTimer > this.frameInterval) {
        this.frameTimer = 0;
        this.currentFrame = (this.currentFrame + 1) % this.walkingSprites.length;
      }
    } else {
      this.currentFrame = 0;
      this.frameTimer = 0;
    }
  }

  updateJumpState() {
    // If player is NOT on the ground or platform -> jumping
    const grounded = this.y >= CONFIG.player.groundY ||
      isOnPlatform(this.x, this.y, this.width, this.height, CONFIG.platforms) !== null;

    this.isJumping = !grounded;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const invuln = Date.now() < this.invulnUntil;
    const flicker = (!this.isFlickering || Math.floor(Date.now() / 100) % 2 === 0) &&
      (!invuln || Math.floor(Date.now() / 100) % 2 === 0);

    let sprite;
    if (this.isThrowing()) {
      sprite = this.throwSprite;     // Throw takes priority
    } else if (this.isJumping) {
      sprite = this.jumpSprite;      // Jump if in air
    } else if (Math.abs(this.velX) > 0 || this.movingHorizontally) {
      sprite = this.walkingSprites[this.currentFrame]; // Walk anim
    } else {
      sprite = this.idleSprite;      // Idle
    }

    if (flicker) {
      if (this.facingLeft) {
        ctx.scale(-1, 1);
        ctx.drawImage(sprite, -this.width, 0, this.width, this.height);
      } else {
        ctx.drawImage(sprite, 0, 0, this.width, this.height);
      }
    }
    ctx.restore();
  }

  applyGravity() {
    this.velY += CONFIG.player.gravity;
    this.y += this.velY;
  }

  setFacingFromInput(keys) {
    if (keys['arrowleft'] || keys['a']) this.facingLeft = true;
    if (keys['arrowright'] || keys['d']) this.facingLeft = false;
  }

  updateFlicker(touch) {
    const { holdMs, durationMs, slowFactor } = CONFIG.player.flicker;
    if (touch) {
      if (!this.touchStartTime) this.touchStartTime = Date.now();
      if (!this.isFlickering && Date.now() - this.touchStartTime >= holdMs) {
        this.isFlickering = true;
        this.flickerStartTime = Date.now();
        this.speed = this.baseSpeed * slowFactor;
      }
    } else this.touchStartTime = null;

    if (this.isFlickering && Date.now() - this.flickerStartTime >= durationMs) {
      this.isFlickering = false;
      this.speed = this.baseSpeed;
    }
  }

  takeTouchDamage(now) {
    if (now < this.invulnUntil) return false;
    if (now - this.lastHurtAt >= CONFIG.combat.touchDamageCooldown) {
      this.hp -= CONFIG.combat.touchDamage;
      this.lastHurtAt = now;
      return true;
    }
    return false;
  }

  setInvulnerableForRespawn() {
    this.invulnUntil = Date.now() + CONFIG.player.respawnInvulnMs;
  }

  getLives() { return this.lives; }
  getHP() { return this.hp; }
}


// ======= Game Controller =======
class Game {
  constructor(ctx) {
    this.ctx = ctx; this.keys = {}; this.canJump = true;
    this.platforms = CONFIG.platforms; this.player = new Player(375, CONFIG.player.groundY);
    this.bullets = []; this.enemies = []; this.currentBullet = 1;
    this.wave = 0; this.enemiesRemaining = 0; this.waveInProgress = false;
    this.score = 0; this.gameOver = false; this.lastWaveTime = Date.now();
    this._wireInputs(); this.updateHUD();
  }

  _wireInputs() {
    const prevent = ['arrowleft', 'arrowright', 'arrowup', ' ', 'w', 'a', 's', 'd', 'x', 'enter'];
    document.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase(); this.keys[k] = true; if (prevent.includes(k)) e.preventDefault();
      if (k === 'arrowleft' || k === 'a') this.player.facingLeft = true;
      if (k === 'arrowright' || k === 'd') this.player.facingLeft = false;
      if ((k === ' ' || k === 'arrowup' || k === 'w') && this._isPlayerGroundedOrOnPlatform() && this.canJump) { this.player.velY = CONFIG.player.jumpStrength; this.canJump = false; }
      if (!this.player.isFlickering && (k === 'x' || k === 'enter')) this._shoot(this.currentBullet);
      if (k === 'c') { const idx = CONFIG.bulletTypes.indexOf(this.currentBullet); this.currentBullet = CONFIG.bulletTypes[(idx + 1) % CONFIG.bulletTypes.length]; }
    });
    document.addEventListener('keyup', (e) => { const k = e.key.toLowerCase(); this.keys[k] = false; if (k === ' ' || k === 'arrowup' || k === 'w') this.canJump = true; });
  }

  _shoot(type) {
    const spec = CONFIG.bullets[type]; if (!spec) return;
    const dir = this.player.facingLeft ? -1 : 1; const px = this.player.facingLeft ? this.player.x : this.player.x + this.player.width;
    const py = this.player.y + this.player.height / 2 - spec.height / 2;
    this.bullets.push(new Bullet(px, py, dir, type));

    // === Player Throw Event ===
    this.player.setThrow();
  }

  // ==== NEW WAVE SYSTEM ====
  spawnWave() {
    this.wave++; this.waveInProgress = true;
    const total = CONFIG.waves.startEnemies + this.wave * 2;
    this.enemiesRemaining = total;

    const enemyKeys = Object.keys(CONFIG.enemies);
    const maxIndex = Math.min(this.wave - 1, enemyKeys.length - 1);
    const available = enemyKeys.slice(0, maxIndex + 1);

    let spawned = 0;
    const interval = setInterval(() => {
      if (spawned >= total) { clearInterval(interval); this.waveInProgress = false; return; }
      const type = available[Math.floor(Math.random() * available.length)];
      const spec = CONFIG.enemies[type]; const sideLeft = Math.random() < 0.5;
      const x = sideLeft ? -spec.width : canvas.width;
      this.enemies.push(new Enemy(x, CONFIG.player.groundY, type, this.wave));
      spawned++; this.enemiesRemaining--;
    }, Math.max(400, 1500 - this.wave * 100));
    this.lastWaveTime = Date.now();
  }

  _isPlayerGroundedOrOnPlatform() {
    const { x, y, width, height, velY } = this.player;
    if (y >= CONFIG.player.groundY && velY >= 0) return true;
    const platY = isOnPlatform(x, y, width, height, this.platforms); return platY !== null && velY >= 0;
  }

  _movePlayerHorizontal() {
    if (this.keys['arrowleft'] || this.keys['a']) { this.player.x -= this.player.speed; this.player.facingLeft = true; }
    if (this.keys['arrowright'] || this.keys['d']) { this.player.x += this.player.speed; this.player.facingLeft = false; }
    this.player.x = clamp(this.player.x, 0, canvas.width - this.player.width);
  }

  _applyPlayerPhysics() {
    this.player.applyGravity();
    const platY = isOnPlatform(this.player.x, this.player.y, this.player.width, this.player.height, this.platforms);
    if (platY !== null && this.player.velY >= 0) { this.player.y = platY; this.player.velY = 0; }
    if (this.player.y >= CONFIG.player.groundY) { this.player.y = CONFIG.player.groundY; this.player.velY = 0; }
  }

  _updateEnemiesAI() {
    for (let e of this.enemies) {
      if (e.dead || e.health <= 0) continue;

      // Add a dead-zone so enemies don't flicker if the player is nearly above
      const deadZone = e.width / 4; // tweak this (1/4 of enemy width works well)

      if (this.player.x < e.x - deadZone) {
        e.x -= e.speed;
        e.isFacingLeft = true;
      } else if (this.player.x > e.x + deadZone) {
        e.x += e.speed;
        e.isFacingLeft = false;
      }
      // else: player is in the dead-zone above → no horizontal move, keep facing


      if (this.player.y < e.y && e.velY === 0) {
        e.velY = CONFIG.waves.enemyJumpStrength;
      }

      e.applyGravity();
      e.groundClamp(CONFIG.player.groundY);

      const platY = isOnPlatform(e.x, e.y, e.width, e.height, this.platforms);
      if (platY !== null && e.velY >= 0) {
        e.y = platY;
        e.velY = 0;
      }

      e.x = clamp(e.x, 0, canvas.width - e.width);
    }

    for (let e of this.enemies) {
      e.updateAnimation(10); // ~16ms/frame (60fps)
    }
  }

  _updateBullets() { for (const b of this.bullets) b.update(); this.bullets = this.bullets.filter(b => !b.isOffscreen() && !b.dead); }

  _bulletEnemyCollisions() {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i]; let hit = false;
      for (let e of this.enemies) {
        if (e.dead || e.health <= 0) continue;
        if (aabbOverlap(b.x, b.y, b.width, b.height, e.x, e.y, e.width, e.height)) {
          const dmg = (DAMAGE_MATRIX[b.type] && DAMAGE_MATRIX[b.type][e.type]) || 0; e.health -= dmg;
          if (e.health <= 0) { e.dead = true; this.score += 10; this.updateHUD(); }
          b.dead = true; hit = true; break;
        }
      }
      if (hit) this.bullets.splice(i, 1);
    }
  }

  _playerEnemyContactAndFlicker() {
    let touching = false; const now = Date.now();
    for (const e of this.enemies) {
      if (e.dead || e.health <= 0) continue;
      if (aabbOverlap(this.player.x, this.player.y, this.player.width, this.player.height, e.x, e.y, e.width, e.height)) {
        touching = true; const damaged = this.player.takeTouchDamage(now);
        if (damaged && this.player.hp <= 0) {
          this.player.lives--;
          if (this.player.lives > 0) { this.player.hp = CONFIG.player.maxHP; this.player.setInvulnerableForRespawn(); }
          else this.gameOver = true; this.updateHUD();
        }
      }
    }
    this.player.updateFlicker(touching);
  }

  _drawPlatforms() { for (let plat of this.platforms) { this.ctx.drawImage(IMAGES.platform, plat.x, plat.y, plat.width, plat.height); } }
  _drawHUDInsideCanvas() { this.ctx.fillStyle = 'white'; this.ctx.font = '16px Arial'; this.ctx.fillText(`HP: ${Math.max(0, this.player.hp)} / ${CONFIG.player.maxHP}`, 20, 30); }
  _drawAll() {
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const b of this.bullets) b.draw(this.ctx);
    for (const e of this.enemies) e.draw(this.ctx);
    this.player.draw(this.ctx); this._drawPlatforms(); this._drawHUDInsideCanvas();
    if (this.gameOver) { this.ctx.fillStyle = 'red'; this.ctx.font = '40px Arial'; this.ctx.fillText('GAME OVER', canvas.width / 2 - 120, canvas.height / 2); }
  }

  _maybeSpawnWave() {
    const alive = this.enemies.some(e => !e.dead && e.health > 0);
    const timeSince = Date.now() - this.lastWaveTime;
    if (!alive && !this.waveInProgress && timeSince >= CONFIG.waves.coolDownMs) { this.spawnWave(); }
  }

  update() {
    if (this.gameOver) return;

    this._movePlayerHorizontal();
    this._applyPlayerPhysics();
    this.player.updateJumpState();

    // update player animation
    this.player.movingHorizontally = this.keys['arrowleft'] || this.keys['a'] ||
      this.keys['arrowright'] || this.keys['d'];
    this.player.updateAnimation(16); // ~16ms per frame (60fps)
    this.player.didThrow = false;

    this._updateEnemiesAI();
    this._updateBullets();
    this._bulletEnemyCollisions();
    this._playerEnemyContactAndFlicker();
    this._maybeSpawnWave();

    this.enemies = this.enemies.filter(e => !e.dead);
  }


  frame() {
    this.update(); this._drawAll();
    if (!this.gameOver) requestAnimationFrame(() => this.frame());
    else this.updateHUD();
  }

  updateHUD() { if (scoreEl) scoreEl.textContent = `Score: ${this.score}`; if (livesEl) livesEl.textContent = `Lives: ${Math.max(0, this.player.lives)}`; }
}

// ======= Boot =======
preloadImages(() => { const game = new Game(ctx); game.spawnWave(); game.frame(); });
