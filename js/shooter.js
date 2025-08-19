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
    1: { width: 20, height: 20, speed: 8, src: 'assets/bullets/PHbullet.png' },
    2: { width: 20, height: 20, speed: 10, src: 'assets/bullets/PHbulletB.png' },
    3: { width: 20, height: 20, speed: 12, src: 'assets/bullets/PHbulletC.png' }
  },
  bulletTypes: [1, 2, 3],
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
};

// ======= Assets =======
const IMAGES = { player: new Image(), platform: new Image(), bullets: {}, enemies: {} };

function preloadImages(onAllLoaded) {
  const toLoad = [];
  IMAGES.player.src = CONFIG.sprites.player;
  IMAGES.platform.src = CONFIG.sprites.platform;
  toLoad.push(IMAGES.player, IMAGES.platform);

  for (const [type, info] of Object.entries(CONFIG.bullets)) {
    const img = new Image(); img.src = info.src;
    IMAGES.bullets[type] = img; toLoad.push(img);
  }
  for (const [type, info] of Object.entries(CONFIG.enemies)) {
    const img = new Image(); img.src = info.src;
    IMAGES.enemies[type] = img; toLoad.push(img);
  }
  let loaded = 0;
  toLoad.forEach(img => {
    img.onload = img.onerror = () => { loaded++; if (loaded === toLoad.length) onAllLoaded(); };
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
    const spec = CONFIG.enemies[type]; super(x, y, spec.width, spec.height);
    this.type = type; this.speed = spec.baseSpeed + wave * 0.2; this.health = spec.baseHealth; this.dead = false;
  }
  applyGravity() { this.velY += CONFIG.player.gravity; this.y += this.velY; }
  groundClamp(groundY) { if (this.y >= groundY) { this.y = groundY; this.velY = 0; } }
  draw(ctx) { if (!this.dead && this.health > 0) ctx.drawImage(IMAGES.enemies[this.type], this.x, this.y, this.width, this.height); }
}

class Player extends Body {
  constructor(x, y) {
    super(x, y, CONFIG.player.width, CONFIG.player.height);
    this.baseSpeed = CONFIG.player.speed; this.speed = this.baseSpeed;
    this.facingLeft = false; this.isFlickering = false;
    this.touchStartTime = null; this.flickerStartTime = null;
    this.hp = CONFIG.player.maxHP; this.lives = CONFIG.player.lives;
    this.invulnUntil = 0; this.lastHurtAt = 0;
  }
  draw(ctx) {
    ctx.save(); ctx.translate(this.x, this.y);
    const invuln = Date.now() < this.invulnUntil;
    const flicker = (!this.isFlickering || Math.floor(Date.now() / 100) % 2 === 0) &&
      (!invuln || Math.floor(Date.now() / 100) % 2 === 0);
    if (this.facingLeft) { ctx.scale(-1, 1); if (flicker) ctx.drawImage(IMAGES.player, -this.width, 0, this.width, this.height); }
    else { if (flicker) ctx.drawImage(IMAGES.player, 0, 0, this.width, this.height); }
    ctx.restore();
  }
  applyGravity() { this.velY += CONFIG.player.gravity; this.y += this.velY; }
  setFacingFromInput(keys) { if (keys['arrowleft'] || keys['a']) this.facingLeft = true; if (keys['arrowright'] || keys['d']) this.facingLeft = false; }
  updateFlicker(touch) {
    const { holdMs, durationMs, slowFactor } = CONFIG.player.flicker;
    if (touch) {
      if (!this.touchStartTime) this.touchStartTime = Date.now();
      if (!this.isFlickering && Date.now() - this.touchStartTime >= holdMs) { this.isFlickering = true; this.flickerStartTime = Date.now(); this.speed = this.baseSpeed * slowFactor; }
    } else this.touchStartTime = null;
    if (this.isFlickering && Date.now() - this.flickerStartTime >= durationMs) { this.isFlickering = false; this.speed = this.baseSpeed; }
  }
  takeTouchDamage(now) {
    if (now < this.invulnUntil) return false;
    if (now - this.lastHurtAt >= CONFIG.combat.touchDamageCooldown) { this.hp -= CONFIG.combat.touchDamage; this.lastHurtAt = now; return true; }
    return false;
  }
  setInvulnerableForRespawn() { this.invulnUntil = Date.now() + CONFIG.player.respawnInvulnMs; }
  getLives() { return this.lives; } getHP() { return this.hp; }
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
      if (this.player.x < e.x) e.x -= e.speed; else e.x += e.speed;
      if (this.player.y < e.y && e.velY === 0) e.velY = CONFIG.waves.enemyJumpStrength;
      e.applyGravity(); e.groundClamp(CONFIG.player.groundY);
      const platY = isOnPlatform(e.x, e.y, e.width, e.height, this.platforms);
      if (platY !== null && e.velY >= 0) { e.y = platY; e.velY = 0; }
      e.x = clamp(e.x, 0, canvas.width - e.width);
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
    this._movePlayerHorizontal(); this._applyPlayerPhysics();
    this._updateEnemiesAI(); this._updateBullets();
    this._bulletEnemyCollisions(); this._playerEnemyContactAndFlicker();
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
