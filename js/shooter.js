// ===== Canvas & Context =====
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ===== HUD (outside canvas) =====
const scoreEl = document.getElementById('score'); // should exist in HTML
const livesEl = document.getElementById('lives'); // should exist in HTML

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
    1: { width: 20, height: 20, speed: 8,  src: 'assets/bullets/PHbullet.png' },
    2: { width: 20, height: 20, speed: 10, src: 'assets/bullets/PHbulletB.png' },
    3: { width: 20, height: 20, speed: 12, src: 'assets/bullets/PHbulletC.png' }
  },
  bulletTypes: [1, 2, 3], // order of bullet types for cycling
  enemies: {
    1: { width: 50, height: 50, baseSpeed: 1.2, baseHealth: 10, src: 'assets/enemies/PHenemy.png' },
    2: { width: 50, height: 50, baseSpeed: 0.9, baseHealth: 20, src: 'assets/enemies/PHenemyB.png' },
    3: { width: 50, height: 50, baseSpeed: 1.0, baseHealth: 15, src: 'assets/enemies/PHenemyC.png' }
  },
  sprites: {
    player: 'assets/player/PHplayer.png',
    platform: 'assets/environment/PHplatform.png'
  },
  waves: {
    startEnemies: 3,
    coolDownMs: 2000,
    randomSpawnChancePerFrame: 0.01,
    enemyJumpStrength: -8
  },
  platforms: [
    { x: 0,   y: 500, width: 200, height: 30 },
    { x: 200, y: 400, width: 200, height: 30 },
    { x: 600, y: 300, width: 200, height: 30 },
  ]
};

// ======= DAMAGE MATRIX =======
const DAMAGE_MATRIX = {
  1: { 1: 5, 2: 1, 3: 10 },
  2: { 1: 1, 2: 10, 3: 10 },
  3: { 1: 10, 2: 10, 3: 10 },
};

// ======= Assets (images) =======
const IMAGES = {
  player: new Image(),
  platform: new Image(),
  bullets: {},
  enemies: {},
};

// Preload images by type keys in CONFIG
function preloadImages(onAllLoaded) {
  const toLoad = [];

  IMAGES.player.src = CONFIG.sprites.player;
  IMAGES.platform.src = CONFIG.sprites.platform;
  toLoad.push(IMAGES.player, IMAGES.platform);

  for (const [type, info] of Object.entries(CONFIG.bullets)) {
    const img = new Image();
    img.src = info.src;
    IMAGES.bullets[type] = img;
    toLoad.push(img);
  }

  for (const [type, info] of Object.entries(CONFIG.enemies)) {
    const img = new Image();
    img.src = info.src;
    IMAGES.enemies[type] = img;
    toLoad.push(img);
  }

  let loaded = 0;
  toLoad.forEach(img => {
    img.onload = () => {
      loaded++;
      if (loaded === toLoad.length) onAllLoaded();
    };
    // if an image fails to load, still attempt to continue after a while
    img.onerror = () => {
      loaded++;
      if (loaded === toLoad.length) onAllLoaded();
    };
  });
}

// ======= Utility helpers =======
function aabbOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
function isOnPlatform(px, py, pw, ph, platforms) {
  for (let plat of platforms) {
    if (
      py + ph >= plat.y && py + ph <= plat.y + plat.height &&
      px + pw > plat.x && px < plat.x + plat.width
    ) {
      return plat.y - ph;
    }
  }
  return null;
}

// ======= Base Classes =======
class Body {
  constructor(x, y, w, h) {
    this.x = x; this.y = y;
    this.width = w; this.height = h;
    this.velY = 0;
  }
}

class Bullet {
  constructor(x, y, dir, type) {
    const rawSpec = CONFIG.bullets?.[type] || CONFIG.bullets?.[1];
    if (!rawSpec) throw new Error('No bullet types configured in CONFIG.bullets');

    this.type = CONFIG.bullets?.[type] ? type : 1;
    this.x = x;
    this.y = y;
    this.dir = dir; // -1 left, 1 right
    this.width = rawSpec.width;
    this.height = rawSpec.height;
    this.speed = rawSpec.speed;
    this.dead = false;
  }
  update() {
    this.x += this.dir * this.speed;
  }
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
  isOffscreen() {
    return this.x < -this.width || this.x > canvas.width + this.width;
  }
}

class Enemy extends Body {
  constructor(x, y, type, wave) {
    const spec = CONFIG.enemies?.[type];
    if (!spec) throw new Error(`Unknown enemy type "${type}"`);
    super(x, y, spec.width, spec.height);
    this.type = type;
    this.speed = spec.baseSpeed + wave * 0.2;
    this.health = spec.baseHealth;
    this.dead = false;
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
    if (!this.dead && this.health > 0) {
      ctx.drawImage(IMAGES.enemies[this.type], this.x, this.y, this.width, this.height);
    }
  }
}

// Player class keeps time-based HP and flicker; respawn is changed below to NOT teleport.
class Player extends Body {
  constructor(x, y) {
    super(x, y, CONFIG.player.width, CONFIG.player.height);
    this.baseSpeed = CONFIG.player.speed;
    this.speed = CONFIG.player.speed;
    this.facingLeft = false;

    // State
    this.isFlickering = false;
    this.touchStartTime = null;
    this.flickerStartTime = null;

    // Combat / HP
    this.hp = CONFIG.player.maxHP;
    this.lives = CONFIG.player.lives;
    this.invulnUntil = 0;
    this.lastHurtAt = 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    const inRespawnInvuln = Date.now() < this.invulnUntil;
    const flickerVisible =
      (!this.isFlickering || Math.floor(Date.now() / 100) % 2 === 0) &&
      (!inRespawnInvuln || Math.floor(Date.now() / 100) % 2 === 0);

    if (this.facingLeft) {
      ctx.scale(-1, 1);
      if (flickerVisible) ctx.drawImage(IMAGES.player, -this.width, 0, this.width, this.height);
    } else {
      if (flickerVisible) ctx.drawImage(IMAGES.player, 0, 0, this.width, this.height);
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

  updateFlicker(touchingEnemy) {
    const { holdMs, durationMs } = CONFIG.player.flicker;
    if (touchingEnemy) {
      if (!this.touchStartTime) this.touchStartTime = Date.now();
      if (!this.isFlickering && Date.now() - this.touchStartTime >= holdMs) {
        this.isFlickering = true;
        this.flickerStartTime = Date.now();
        this.speed = this.baseSpeed * CONFIG.player.flicker.slowFactor;
      }
    } else {
      this.touchStartTime = null;
    }
    if (this.isFlickering && Date.now() - this.flickerStartTime >= durationMs) {
      this.isFlickering = false;
      this.speed = this.baseSpeed;
    }
  }

  // returns true if damage was applied (rate-limited tick)
  takeTouchDamage(now) {
    if (now < this.invulnUntil) return false;

    if (now - this.lastHurtAt >= CONFIG.combat.touchDamageCooldown) {
      this.hp -= CONFIG.combat.touchDamage;
      this.lastHurtAt = now;
      return true;
    }
    return false;
  }

  // Set player invulnerable for the configured respawn invuln ms (flicker shown by draw)
  setInvulnerableForRespawn() {
    this.invulnUntil = Date.now() + CONFIG.player.respawnInvulnMs;
  }

  // used for HUD update convenience
  getLives() { return this.lives; }
  getHP() { return this.hp; }
}

// ======= Game Controller (patched behavior) =======
class Game {
  constructor(ctx) {
    this.ctx = ctx;
    this.keys = {};
    this.canJump = true;
    this.platforms = CONFIG.platforms;
    this.player = new Player(375, CONFIG.player.groundY);
    this.bullets = [];
    this.enemies = [];
    this.currentBullet = 1;
    this.wave = 1;
    this.enemiesPerWave = CONFIG.waves.startEnemies;
    this.lastWaveTime = Date.now();
    this.score = 0;
    this.gameOver = false;

    this._wireInputs();
    this.updateHUD();
  }



  _wireInputs() {
    const shouldPrevent = (k) =>
      ['arrowleft','arrowright','arrowup',' ','w','a','s','d','x','enter'].includes(k);

    document.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      this.keys[k] = true;
      if (shouldPrevent(k)) e.preventDefault();

      if (k === 'arrowleft' || k === 'a') this.player.facingLeft = true;
      if (k === 'arrowright' || k === 'd') this.player.facingLeft = false;

      // Jump
      if (k === ' ' || k === 'arrowup' || k === 'w') {
        const grounded = this._isPlayerGroundedOrOnPlatform();
        if (grounded && this.canJump) {
          this.player.velY = CONFIG.player.jumpStrength;
          this.canJump = false;
        }
      }

      // Shoot — disabled when flickering
      if (!this.player.isFlickering) {
        if (k === 'x' || k === 'enter') this._shoot(this.currentBullet);
      }

      // Bullet type switch
      if (k === 'c') {
        const idx = CONFIG.bulletTypes.indexOf(this.currentBullet);
        const nextIdx = (idx + 1) % CONFIG.bulletTypes.length;
        this.currentBullet = CONFIG.bulletTypes[nextIdx];
      }
    });

    document.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      this.keys[k] = false;
      if (k === ' ' || k === 'arrowup' || k === 'w') this.canJump = true;
    });
  }

  _shoot(type) {
    const spec = CONFIG.bullets?.[type];
    if (!spec) return;
    const dir = this.player.facingLeft ? -1 : 1;
    const px = this.player.facingLeft ? this.player.x : this.player.x + this.player.width;
    const py = this.player.y + this.player.height / 2 - spec.height / 2;
    try {
      this.bullets.push(new Bullet(px, py, dir, type));
    } catch {
      // ignore
    }
  }

  spawnWave() {
    const enemyTypes = Object.keys(CONFIG.enemies);
    if (enemyTypes.length === 0) return;

    for (let i = 0; i < this.enemiesPerWave; i++) {
      const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
      const spec = CONFIG.enemies[type];
      const sideLeft = Math.random() < 0.5;
      const x = sideLeft ? 0 : canvas.width - spec.width;
      this.enemies.push(new Enemy(x, CONFIG.player.groundY, type, this.wave));
    }
    this.wave++;
    this.lastWaveTime = Date.now();
  }

  _isPlayerGroundedOrOnPlatform() {
    const { x, y, width, height, velY } = this.player;
    if (y >= CONFIG.player.groundY && velY >= 0) return true;
    const platY = isOnPlatform(x, y, width, height, this.platforms);
    return platY !== null && velY >= 0;
  }

  _movePlayerHorizontal() {
    if (this.keys['arrowleft'] || this.keys['a']) {
      this.player.x -= this.player.speed;
      this.player.facingLeft = true;
    }
    if (this.keys['arrowright'] || this.keys['d']) {
      this.player.x += this.player.speed;
      this.player.facingLeft = false;
    }
    this.player.x = clamp(this.player.x, 0, canvas.width - this.player.width);
  }

  _applyPlayerPhysics() {
    this.player.applyGravity();

    const platY = isOnPlatform(this.player.x, this.player.y, this.player.width, this.player.height, this.platforms);
    if (platY !== null && this.player.velY >= 0) {
      this.player.y = platY;
      this.player.velY = 0;
    }
    if (this.player.y >= CONFIG.player.groundY) {
      this.player.y = CONFIG.player.groundY;
      this.player.velY = 0;
    }
  }

  _updateEnemiesAI() {
    for (let e of this.enemies) {
      if (e.dead || e.health <= 0) continue;

      if (this.player.x < e.x) e.x -= e.speed;
      else e.x += e.speed;

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
  }

  _updateBullets() {
    for (const b of this.bullets) b.update();
    this.bullets = this.bullets.filter(b => !b.isOffscreen() && !b.dead);
  }

  // bullet -> enemy collisions. Score +10 per kill (not per hit).
  _bulletEnemyCollisions() {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      let hit = false;

      for (let j = 0; j < this.enemies.length; j++) {
        const e = this.enemies[j];
        if (e.dead || e.health <= 0) continue;

        if (aabbOverlap(
          b.x, b.y, b.width, b.height,
          e.x, e.y, e.width, e.height
        )) {
          const dmg = (DAMAGE_MATRIX[b.type] && DAMAGE_MATRIX[b.type][e.type]) || 0;
          e.health -= dmg;
          if (e.health <= 0) {
            e.dead = true;
            this.score += 10; // +10 per kill (patched)
            this.updateHUD();
          }
          b.dead = true;
          hit = true;
          break;
        }
      }
      if (hit) this.bullets.splice(i, 1);
    }
  }

  // Player-enemy contact: time-based flicker and damage. When HP hits 0, lose a life.
  _playerEnemyContactAndFlicker() {
    let touching = false;
    const now = Date.now();

    for (const e of this.enemies) {
      if (e.dead || e.health <= 0) continue;
      if (aabbOverlap(
        this.player.x, this.player.y, this.player.width, this.player.height,
        e.x, e.y, e.width, e.height
      )) {
        touching = true;

        // Try to apply touch damage (rate limited)
        const damaged = this.player.takeTouchDamage(now);
        if (damaged) {
          // If hp dropped to or below zero, handle lives (NO teleport)
          if (this.player.hp <= 0) {
            this.player.lives -= 1; // lose a life
            if (this.player.lives > 0) {
              // reset HP, set short invulnerability/flicker, BUT DO NOT MOVE PLAYER
              this.player.hp = CONFIG.player.maxHP;
              this.player.setInvulnerableForRespawn();
            } else {
              // out of lives -> game over
              this.gameOver = true;
            }
            // update external HUD
            this.updateHUD();
          }
        }
        // allow multiple overlaps but damage ticks are cooldown-limited
      }
    }

    // Flicker slow after holding touch for long (keeps original behavior)
    this.player.updateFlicker(touching);
  }

  _drawPlatforms() {
    for (let plat of this.platforms) {
      this.ctx.drawImage(IMAGES.platform, plat.x, plat.y, plat.width, plat.height);
    }
  }

  // HUD is outside canvas; only draw in-canvas minimal info if you want.
  _drawHUDInsideCanvas() {
    // optional: kept minimal and not required, your external HUD is authoritative
    this.ctx.fillStyle = 'white';
    this.ctx.font = '16px Arial';
    this.ctx.fillText(`HP: ${Math.max(0, this.player.hp)} / ${CONFIG.player.maxHP}`, 20, 30);
  }

  _drawAll() {
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Bullets
    for (const b of this.bullets) b.draw(this.ctx);

    // Enemies
    for (const e of this.enemies) e.draw(this.ctx);

    // Player
    this.player.draw(this.ctx);

    // Platforms
    this._drawPlatforms();

    // small in-canvas HUD
    this._drawHUDInsideCanvas();

    if (this.gameOver) {
      this.ctx.fillStyle = 'red';
      this.ctx.font = '40px Arial';
      this.ctx.fillText('GAME OVER', canvas.width / 2 - 120, canvas.height / 2);
    }
  }

  _maybeRandomSpawn() {
    const enemyTypes = Object.keys(CONFIG.enemies);
    if (enemyTypes.length === 0) return;

    if (Math.random() < CONFIG.waves.randomSpawnChancePerFrame) {
      const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
      const spec = CONFIG.enemies[type];
      const sideLeft = Math.random() < 0.5;
      const x = sideLeft ? -spec.width : canvas.width + spec.width;
      this.enemies.push(new Enemy(x, CONFIG.player.groundY, type, this.wave));
    }
  }

  _maybeSpawnWave() {
    const alive = this.enemies.some(e => !e.dead && e.health > 0);
    const timeSince = Date.now() - this.lastWaveTime;
    if (!alive && timeSince >= CONFIG.waves.coolDownMs) {
      this.spawnWave();
    }
  }

  update() {
    if (this.gameOver) return;

    // Movement
    this._movePlayerHorizontal();
    this._applyPlayerPhysics();

    // Enemies
    this._updateEnemiesAI();

    // Bullets
    this._updateBullets();

    // Collisions & scoring
    this._bulletEnemyCollisions();
    this._playerEnemyContactAndFlicker();

    // Spawns
    this._maybeRandomSpawn();
    this._maybeSpawnWave();

    // Cleanup dead enemies (keeps sprites removal consistent)
    this.enemies = this.enemies.filter(e => !e.dead);
  }

  frame() {
    this.update();
    this._drawAll();
    if (!this.gameOver) {
      requestAnimationFrame(() => this.frame());
    } else {
      // final HUD update and optional cleanup
      this.updateHUD();
    }
  }

  // external HUD update (score & lives outside canvas)
  updateHUD() {
    if (scoreEl) scoreEl.textContent = `Score: ${this.score}`;
    if (livesEl) livesEl.textContent = `Lives: ${Math.max(0, this.player.lives)}`;
  }
}

// ======= Boot =======
preloadImages(() => {
  const game = new Game(ctx);
  game.spawnWave();
  game.frame();
});
